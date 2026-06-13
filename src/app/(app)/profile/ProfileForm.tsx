"use client";

import {
  type ChangeEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { updateProfileAction, type ProfileActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials, type User } from "@/lib/auth";
import { formatCurrencyVND } from "@/lib/finance";
import {
  authFetch,
  normalizeBalance,
  updateUserBalance,
} from "@/lib/moneytrack-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const PROFILE_DETAILS_EVENT = "fintrack-profile-details";

const initialState: ProfileActionState = {
  status: "idle",
  message: "",
};

type ProfileDetails = {
  birthDate: string;
  gender: string;
  occupation: string;
  phone: string;
  address: string;
  bio: string;
};

type BankHubStatus = {
  linked?: boolean;
  isLinked?: boolean;
  status?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  bankhubAccount?: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    status?: string | null;
  } | null;
  account?: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    status?: string | null;
  } | null;
};

type BankHubHostedLink = {
  hostedLinkUrl?: string;
  hosted_link_url?: string;
  linkToken?: string;
  xid?: string;
  expiresAt?: string;
};

const emptyDetails: ProfileDetails = {
  birthDate: "",
  gender: "",
  occupation: "",
  phone: "",
  address: "",
  bio: "",
};

const profileDetailsCache = new Map<
  string,
  { raw: string | null; value: ProfileDetails }
>();

const detailFields: Array<{
  id: keyof ProfileDetails;
  label: string;
  icon: typeof CalendarDays;
  placeholder: string;
  type?: string;
  options?: string[];
}> = [
  {
    id: "birthDate",
    label: "Ngày sinh",
    icon: CalendarDays,
    placeholder: "Chưa cập nhật",
    type: "date",
  },
  {
    id: "gender",
    label: "Giới tính",
    icon: UserRound,
    placeholder: "Chưa cập nhật",
    options: ["Nam", "Nữ", "Khác", "Không muốn chia sẻ"],
  },
  {
    id: "occupation",
    label: "Nghề nghiệp",
    icon: BriefcaseBusiness,
    placeholder: "Chưa cập nhật",
  },
  {
    id: "phone",
    label: "Số điện thoại",
    icon: Phone,
    placeholder: "Chưa cập nhật",
    type: "tel",
  },
  {
    id: "address",
    label: "Địa chỉ",
    icon: MapPin,
    placeholder: "Chưa cập nhật",
  },
];

function getStorageKey(userId: string) {
  return `fintrack_profile_details_${userId}`;
}

function readProfileDetails(userId: string): ProfileDetails {
  if (typeof window === "undefined") {
    return emptyDetails;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    const cached = profileDetailsCache.get(userId);

    if (cached && cached.raw === raw) {
      return cached.value;
    }

    if (!raw) {
      profileDetailsCache.set(userId, { raw: null, value: emptyDetails });
      return emptyDetails;
    }

    const value = {
      ...emptyDetails,
      ...(JSON.parse(raw) as Partial<ProfileDetails>),
    };

    profileDetailsCache.set(userId, { raw, value });

    return value;
  } catch {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    profileDetailsCache.set(userId, { raw, value: emptyDetails });

    return emptyDetails;
  }
}

function subscribeProfileDetails(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROFILE_DETAILS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROFILE_DETAILS_EVENT, onStoreChange);
  };
}

function saveProfileDetails(userId: string, details: ProfileDetails) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(details);
  const value = { ...details };

  window.localStorage.setItem(getStorageKey(userId), raw);
  profileDetailsCache.set(userId, { raw, value });
  window.dispatchEvent(new Event(PROFILE_DETAILS_EVENT));
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function normalizeBankHubStatus(status: BankHubStatus | null) {
  const account = status?.bankhubAccount ?? status?.account ?? status;

  return {
    linked: Boolean(status?.linked ?? status?.isLinked ?? account?.accountNumber),
    bankName: account?.bankName || "BankHub",
    accountNumber: account?.accountNumber || "",
    accountName: account?.accountName || "",
    status: account?.status || status?.status || "",
  };
}

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  );
  const setUser = useAuthStore((authState) => authState.setUser);
  const updateStoredUser = useAuthStore((authState) => authState.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localUser, setLocalUser] = useState<User>(user);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [draftDetails, setDraftDetails] = useState<ProfileDetails>(emptyDetails);
  const [bankHubStatus, setBankHubStatus] = useState<BankHubStatus | null>(null);
  const [bankHubLoading, setBankHubLoading] = useState(true);
  const [bankHubLinking, setBankHubLinking] = useState(false);
  const [bankHubError, setBankHubError] = useState<string | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceUpdating, setBalanceUpdating] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceMessage, setBalanceMessage] = useState<string | null>(null);
  const displayUser = localUser;
  const storedDetails = useSyncExternalStore(
    subscribeProfileDetails,
    () => readProfileDetails(displayUser.id),
    () => emptyDetails
  );
  const avatarSrc = avatarPreview ?? displayUser.avatarUrl ?? "";
  const initials = getInitials(displayUser.name, displayUser.email);
  const hasDetails = Object.values(storedDetails).some(Boolean);
  const bankHub = normalizeBankHubStatus(bankHubStatus);

  useEffect(() => {
    if (state.status === "success" && state.user) {
      setUser(state.user);
      queueMicrotask(() => {
        setLocalUser(state.user!);
        setAvatarPreview(null);
        setAvatarFileName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
    }
  }, [state, setUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    let ignore = false;

    async function loadBankHubStatus() {
      setBankHubLoading(true);
      setBankHubError(null);
      try {
        const status = await authFetch<BankHubStatus>("/api/bankhub/status");
        if (!ignore) setBankHubStatus(status);
      } catch (err) {
        if (!ignore) {
          setBankHubError(
            err instanceof Error ? err.message : "Khong the tai BankHub"
          );
        }
      } finally {
        if (!ignore) setBankHubLoading(false);
      }
    }

    void loadBankHubStatus();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleBankHubLink() {
    setBankHubLinking(true);
    setBankHubError(null);
    try {
      const data = await authFetch<BankHubHostedLink>("/api/bankhub/hosted-link", {
        method: "POST",
      });
      const url = data.hostedLinkUrl || data.hosted_link_url;

      if (!url) {
        throw new Error("Backend khong tra hostedLinkUrl");
      }

      window.location.assign(url);
    } catch (err) {
      setBankHubError(
        err instanceof Error ? err.message : "Khong the tao link BankHub"
      );
      setBankHubLinking(false);
    }
  }

  function openBalanceModal() {
    setBalanceInput(String(normalizeBalance(displayUser.balance) || ""));
    setBalanceError(null);
    setBalanceMessage(null);
    setBalanceModalOpen(true);
  }

  async function handleBalanceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedValue = balanceInput.replace(/[^\d.]/g, "");
    const nextBalance = Number(normalizedValue);

    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      setBalanceError("So du phai la so lon hon hoac bang 0.");
      return;
    }

    setBalanceUpdating(true);
    setBalanceError(null);
    try {
      const result = await updateUserBalance(nextBalance);
      const nextUser = result.user
        ? { ...displayUser, ...result.user, balance: result.balance }
        : { ...displayUser, balance: result.balance };

      setLocalUser(nextUser);
      setUser(nextUser);
      updateStoredUser({ balance: result.balance });
      setBalanceMessage("Da cap nhat so du tai khoan.");
      setBalanceModalOpen(false);
    } catch (err) {
      setBalanceError(
        err instanceof Error ? err.message : "Khong the cap nhat so du"
      );
    } finally {
      setBalanceUpdating(false);
    }
  }

  const openAvatarPicker = () => {
    setIsEditing(true);
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarPreview(null);
      setAvatarFileName("");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFileName(file.name);
    setIsAvatarOpen(false);
  };

  const handleEdit = () => {
    setDraftDetails(storedDetails);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftDetails(storedDetails);
    setAvatarPreview(null);
    setAvatarFileName("");
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    saveProfileDetails(displayUser.id, draftDetails);
    setIsEditing(false);
  };

  return (
    <>
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]"
      >
        <input
          ref={fileInputRef}
          id="avatarFile"
          name="avatarFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={handleAvatarChange}
        />
        <input
          type="hidden"
          name="currentAvatarUrl"
          value={displayUser.avatarUrl ?? ""}
        />

        <aside className="animate-rise overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-xl shadow-teal-950/[0.06] backdrop-blur">
          <div className="bg-[linear-gradient(135deg,#0f766e,#12312b,#2563eb)] px-6 py-8 text-white">
            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                className="group relative flex size-32 items-center justify-center overflow-hidden rounded-[2.25rem] border border-white/25 bg-white text-4xl font-black text-teal-700 shadow-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/25"
                onClick={() => setIsAvatarOpen(true)}
                aria-label="Xem ảnh đại diện"
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={displayUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
                <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-950/72 via-slate-950/10 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-teal-800 shadow-sm">
                    <Camera className="size-3.5" aria-hidden="true" />
                    Xem ảnh
                  </span>
                </span>
              </button>
              <h2 className="mt-5 text-2xl font-black text-white">
                {displayUser.name}
              </h2>
              <p className="mt-1 max-w-full truncate text-sm text-teal-50/75">
                {displayUser.email}
              </p>
              {avatarFileName ? (
                <p className="mt-3 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-teal-50">
                  Đã chọn: {avatarFileName}
                </p>
              ) : null}
            </div>
          </div>

          <dl className="divide-y divide-teal-100 px-6 py-3 text-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="flex items-center gap-2 text-slate-500">
                <UserRound className="size-4 text-teal-600" aria-hidden="true" />
                Vai trò
              </dt>
              <dd className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
                {displayUser.role}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="flex items-center gap-2 text-slate-500">
                <Mail className="size-4 text-teal-600" aria-hidden="true" />
                Đăng nhập
              </dt>
              <dd className="font-bold capitalize text-slate-900">
                {displayUser.provider || "local"}
              </dd>
            </div>
            
          </dl>

          <div className="border-t border-teal-100 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Landmark className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">BankHub</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                  {bankHubLoading
                    ? "Dang kiem tra lien ket..."
                    : bankHub.linked
                      ? `${bankHub.bankName}${bankHub.accountNumber ? ` - ${bankHub.accountNumber}` : ""}`
                      : "Chua lien ket tai khoan ngan hang"}
                </p>
                {bankHub.accountName ? (
                  <p className="mt-1 truncate text-xs font-bold text-slate-700">
                    {bankHub.accountName}
                  </p>
                ) : null}
                {bankHub.status ? (
                  <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase text-teal-700">
                    {bankHub.status}
                  </span>
                ) : null}
              </div>
            </div>

            {bankHubError ? (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {bankHubError}
              </p>
            ) : null}

            <Button
              type="button"
              className="mt-4 h-10 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95"
              disabled={bankHubLoading || bankHubLinking || bankHub.linked}
              onClick={() => void handleBankHubLink()}
            >
              {bankHubLinking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ExternalLink className="size-4" aria-hidden="true" />
              )}
              {bankHub.linked ? "Da lien ket BankHub" : "Lien ket BankHub"}
            </Button>
            {!bankHub.linked ? (
              <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-3">
                <p className="text-xs font-semibold leading-5 text-teal-800">
                  Bạn có thể thiết lập sau trong phần Hồ sơ/Cài đặt
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full border border-teal-200 bg-white px-4 text-sm font-bold text-teal-800 transition hover:bg-teal-50"
                >
                  Bỏ qua
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-7 [animation-delay:80ms]">
          <div className="flex flex-col gap-4 border-b border-teal-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">
                Hồ sơ cá nhân
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Thông tin chi tiết
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-teal-100 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-teal-50"
                    onClick={handleCancel}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-11 bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Lưu thay đổi
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-teal-100 bg-white px-5 text-sm font-bold text-teal-800 shadow-sm hover:bg-teal-50"
                  onClick={handleEdit}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Chỉnh sửa thông tin
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <WalletCards className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Vi ca nhan
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {formatCurrencyVND(normalizeBalance(displayUser.balance))}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-teal-100 bg-white px-5 text-sm font-bold text-teal-800 shadow-sm hover:bg-teal-50"
                onClick={openBalanceModal}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Cap nhat so du
              </Button>
            </div>
            {balanceMessage ? (
              <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                {balanceMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="name" className="text-sm font-bold text-slate-700">
                Họ và tên
              </label>
              <Input
                key={`name-${displayUser.name}-${isEditing}`}
                id="name"
                name="name"
                defaultValue={displayUser.name}
                autoComplete="name"
                disabled={!isEditing}
                className="h-12 border-teal-100 bg-white px-5 text-base text-slate-950 shadow-inner shadow-white/70 disabled:bg-slate-50 disabled:text-slate-700 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                required
                minLength={2}
                maxLength={80}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Email</label>
              <div className="flex h-12 items-center rounded-full border border-teal-100 bg-slate-50 px-5 text-base font-medium text-slate-700">
                {displayUser.email}
              </div>
            </div>

            {detailFields.map((field) => {
              const Icon = field.icon;
              const displayValue =
                field.id === "birthDate"
                  ? formatDate(storedDetails.birthDate)
                  : storedDetails[field.id];

              return (
                <div key={field.id} className="space-y-2">
                  <label
                    htmlFor={field.id}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700"
                  >
                    <Icon className="size-4 text-teal-600" aria-hidden="true" />
                    {field.label}
                  </label>
                  {isEditing ? (
                    field.options ? (
                      <select
                        id={field.id}
                        value={draftDetails[field.id]}
                        onChange={(event) =>
                          setDraftDetails((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-full border border-teal-100 bg-white px-5 text-base text-slate-950 shadow-inner shadow-white/70 outline-none transition-colors focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
                      >
                        <option value="">Chọn thông tin</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type ?? "text"}
                        value={draftDetails[field.id]}
                        onChange={(event) =>
                          setDraftDetails((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="h-12 border-teal-100 bg-white px-5 text-base text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                      />
                    )
                  ) : (
                    <div
                      className={cn(
                        "flex min-h-12 items-center rounded-[1.5rem] border border-teal-100 bg-slate-50 px-5 py-3 text-base font-medium",
                        displayValue ? "text-slate-800" : "text-slate-400"
                      )}
                    >
                      {displayValue || field.placeholder}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="bio" className="text-sm font-bold text-slate-700">
                Giới thiệu ngắn
              </label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={draftDetails.bio}
                  onChange={(event) =>
                    setDraftDetails((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Tôi muốn theo dõi chi tiêu cá nhân và tối ưu khoản tiết kiệm hằng tháng."
                  className="min-h-28 w-full resize-none rounded-[1.5rem] border border-teal-100 bg-white px-5 py-4 text-base text-slate-950 shadow-inner shadow-white/70 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
                  maxLength={220}
                />
              ) : (
                <div
                  className={cn(
                    "min-h-24 rounded-[1.5rem] border border-teal-100 bg-slate-50 px-5 py-4 text-base font-medium leading-7",
                    storedDetails.bio ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  {storedDetails.bio ||
                    "Chưa cập nhật. Nhấn chỉnh sửa để bổ sung thông tin cá nhân."}
                </div>
              )}
            </div>
          </div>

          {!hasDetails && !isEditing ? (
            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Hồ sơ chi tiết chưa được bổ sung.
            </div>
          ) : null}

          {state.message ? (
            <div
              role={state.status === "error" ? "alert" : "status"}
              className={
                state.status === "error"
                  ? "mt-5 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                  : "mt-5 flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
              }
            >
              {state.status === "success" ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : null}
              {state.message}
            </div>
          ) : null}
        </section>
      </form>

      {isAvatarOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-center justify-between border-b border-teal-100 px-5 py-4">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Ảnh đại diện
                </p>
                <p className="text-xs text-slate-500">
                  Bấm chọn ảnh mới để cập nhật hồ sơ.
                </p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                onClick={() => setIsAvatarOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-col items-center px-6 py-8">
              <div className="flex size-44 items-center justify-center overflow-hidden rounded-[2.5rem] bg-teal-50 text-5xl font-black text-teal-700 shadow-inner shadow-teal-900/10">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={displayUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <Button
                type="button"
                className="mt-6 h-11 bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-5 text-sm font-bold text-white shadow-lg shadow-teal-700/20"
                onClick={openAvatarPicker}
              >
                <Camera className="size-4" aria-hidden="true" />
                Chọn ảnh mới
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {balanceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleBalanceSubmit}
            className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Cap nhat so du
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Luu truc tiep vao /api/users/me/balance.
                </p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                onClick={() => setBalanceModalOpen(false)}
                aria-label="Dong"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700">
              So du tai khoan
            </label>
            <input
              value={balanceInput}
              onChange={(event) => setBalanceInput(event.target.value)}
              inputMode="decimal"
              placeholder="Vi du: 5000000"
              className="mt-2 h-12 w-full rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Dang hien thi: {formatCurrencyVND(normalizeBalance(balanceInput.replace(/[^\d.]/g, "")))}
            </p>

            {balanceError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {balanceError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50"
              >
                Huy
              </button>
              <button
                type="submit"
                disabled={balanceUpdating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-60"
              >
                {balanceUpdating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Luu so du
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
