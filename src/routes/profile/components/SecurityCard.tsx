import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUTH_QUERY_KEY,
  useChangePasswordMutation,
  useDisable2faMutation,
  useEnable2faMutation,
  useSetup2faMutation,
} from "@/api/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function SecurityCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { mutateAsync: changePassword, isPending: changingPassword } =
    useChangePasswordMutation();

  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify">(
    "idle",
  );
  const [setupData, setSetupData] = useState<{
    qrCodeUrl: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const { mutateAsync: setup2fa, isPending: settingUp2fa } =
    useSetup2faMutation();
  const { mutateAsync: enable2fa, isPending: enabling2fa } =
    useEnable2faMutation();
  const { mutateAsync: disable2fa, isPending: disabling2fa } =
    useDisable2faMutation();

  const twoFactorEnabled = user?.twoFactorEnabled ?? false;

  async function handleChangePassword() {
    setPasswordError(null);

    try {
      await changePassword({ currentPassword, newPassword });
      toast({ title: t("profile.passwordUpdated"), color: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : t("profile.somethingWentWrong"),
      );
    }
  }

  async function handleStartSetup() {
    setTwoFaStep("setup");
    setTwoFaError(null);

    try {
      const result = await setup2fa();
      setSetupData(result);
      setTwoFaStep("verify");
    } catch (error) {
      setTwoFaError(
        error instanceof Error ? error.message : t("profile.somethingWentWrong"),
      );
      setTwoFaStep("idle");
    }
  }

  async function handleEnable2fa() {
    setTwoFaError(null);

    try {
      await enable2fa(verifyCode);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast({ title: t("profile.twoFactorEnabled"), color: "success" });
      setTwoFaStep("idle");
      setSetupData(null);
      setVerifyCode("");
    } catch (error) {
      setTwoFaError(
        error instanceof Error ? error.message : t("validation.codeSixDigits"),
      );
    }
  }

  async function handleDisable2fa() {
    setTwoFaError(null);

    try {
      await disable2fa(disableCode);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast({ title: t("profile.twoFactorDisabled"), color: "success" });
      setDisableCode("");
    } catch (error) {
      setTwoFaError(
        error instanceof Error ? error.message : t("validation.codeSixDigits"),
      );
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("profile.securityTitle")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("profile.securitySubtitle")}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="mb-4 text-sm font-semibold text-neutral-800">
          {t("profile.changePassword")}
        </h3>
        <div className="flex flex-col gap-3">
          <Input
            label={t("profile.currentPassword")}
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            color="teal"
          />
          <Input
            label={t("common.newPassword")}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            color="teal"
          />
          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          )}
          <Button
            color="teal"
            disabled={changingPassword || !currentPassword || !newPassword}
            onClick={handleChangePassword}
          >
            {changingPassword ? t("common.saving") : t("profile.updatePassword")}
          </Button>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-neutral-800">
          {t("profile.twoFactorTitle")}
        </h3>
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              twoFactorEnabled
                ? "bg-teal-100 text-teal-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {twoFactorEnabled ? t("profile.active") : t("profile.inactive")}
          </span>
          <span className="text-sm text-neutral-500">
            {twoFactorEnabled
              ? t("profile.totpProtected")
              : t("profile.totpExtraSecurity")}
          </span>
        </div>

        {twoFaError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {twoFaError}
          </p>
        )}

        {!twoFactorEnabled && twoFaStep === "idle" && (
          <Button
            variant="outline"
            color="teal"
            disabled={settingUp2fa}
            onClick={handleStartSetup}
          >
            {t("profile.enable2fa")}
          </Button>
        )}

        {!twoFactorEnabled && twoFaStep === "setup" && (
          <p className="text-sm text-neutral-400">{t("profile.settingUp")}</p>
        )}

        {!twoFactorEnabled && twoFaStep === "verify" && setupData && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">{t("profile.scanQr")}</p>
            <img
              src={setupData.qrCodeUrl}
              alt={t("profile.twoFactorTitle")}
              className="h-40 w-40"
            />
            <p className="text-sm text-neutral-500">
              {t("profile.enterManually")}{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                {setupData.secret}
              </code>
            </p>
            <Input
              label={t("auth.authenticationCode")}
              placeholder="123456"
              maxLength={6}
              value={verifyCode}
              onChange={(event) => setVerifyCode(event.target.value)}
              color="teal"
            />
            <div className="flex gap-2">
              <Button
                color="teal"
                disabled={enabling2fa || verifyCode.length !== 6}
                onClick={handleEnable2fa}
              >
                {enabling2fa ? t("common.saving") : t("profile.confirm")}
              </Button>
              <Button
                variant="outline"
                color="neutral"
                onClick={() => {
                  setTwoFaStep("idle");
                  setSetupData(null);
                  setVerifyCode("");
                  setTwoFaError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="flex flex-col gap-3">
            <Input
              label={t("profile.currentTotpCode")}
              placeholder="123456"
              maxLength={6}
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              color="teal"
            />
            <Button
              variant="outline"
              color="error"
              disabled={disabling2fa || disableCode.length !== 6}
              onClick={handleDisable2fa}
            >
              {disabling2fa ? t("common.saving") : t("profile.disable2fa")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
