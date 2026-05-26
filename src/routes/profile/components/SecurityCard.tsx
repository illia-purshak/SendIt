import { useState } from "react";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { mutateAsync: changePassword, isPending: changingPassword } =
    useChangePasswordMutation();

  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify">(
    "idle"
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
      toast({ title: "Password updated", color: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Something went wrong"
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
        error instanceof Error ? error.message : "Something went wrong"
      );
      setTwoFaStep("idle");
    }
  }

  async function handleEnable2fa() {
    setTwoFaError(null);

    try {
      await enable2fa(verifyCode);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast({ title: "Two-factor authentication enabled", color: "success" });
      setTwoFaStep("idle");
      setSetupData(null);
      setVerifyCode("");
    } catch (error) {
      setTwoFaError(error instanceof Error ? error.message : "Invalid code");
    }
  }

  async function handleDisable2fa() {
    setTwoFaError(null);

    try {
      await disable2fa(disableCode);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast({ title: "Two-factor authentication disabled", color: "success" });
      setDisableCode("");
    } catch (error) {
      setTwoFaError(error instanceof Error ? error.message : "Invalid code");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900">Security</h2>

      <div className="mb-6">
        <h3 className="mb-4 text-sm font-semibold text-neutral-800">
          Change password
        </h3>
        <div className="flex flex-col gap-3">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            color="green"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            color="green"
          />
          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          )}
          <Button
            color="green"
            disabled={changingPassword || !currentPassword || !newPassword}
            onClick={handleChangePassword}
          >
            {changingPassword ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-neutral-800">
          Two-factor authentication
        </h3>
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              twoFactorEnabled
                ? "bg-green-100 text-green-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {twoFactorEnabled ? "Active" : "Inactive"}
          </span>
          <span className="text-sm text-neutral-500">
            {twoFactorEnabled
              ? "Your account is protected with TOTP."
              : "Add an extra layer of security to your account."}
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
            color="green"
            disabled={settingUp2fa}
            onClick={handleStartSetup}
          >
            Enable 2FA
          </Button>
        )}

        {!twoFactorEnabled && twoFaStep === "setup" && (
          <p className="text-sm text-neutral-400">Setting up...</p>
        )}

        {!twoFactorEnabled && twoFaStep === "verify" && setupData && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Scan this QR code with your authenticator app:
            </p>
            <img
              src={setupData.qrCodeUrl}
              alt="2FA QR code"
              className="h-40 w-40"
            />
            <p className="text-sm text-neutral-500">
              Or enter manually:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                {setupData.secret}
              </code>
            </p>
            <Input
              label="Verification code"
              placeholder="123456"
              maxLength={6}
              value={verifyCode}
              onChange={(event) => setVerifyCode(event.target.value)}
              color="green"
            />
            <div className="flex gap-2">
              <Button
                color="green"
                disabled={enabling2fa || verifyCode.length !== 6}
                onClick={handleEnable2fa}
              >
                {enabling2fa ? "Verifying..." : "Confirm"}
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
                Cancel
              </Button>
            </div>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="flex flex-col gap-3">
            <Input
              label="Current TOTP code"
              placeholder="123456"
              maxLength={6}
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              color="green"
            />
            <Button
              variant="outline"
              color="error"
              disabled={disabling2fa || disableCode.length !== 6}
              onClick={handleDisable2fa}
            >
              {disabling2fa ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
