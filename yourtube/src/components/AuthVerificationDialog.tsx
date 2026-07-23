import { FormEvent, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const southernStates = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

export default function AuthVerificationDialog() {
  const {
    authFlow,
    submitLocation,
    submitPhone,
    verifyOtp,
    cancelAuth,
  } = useUser();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const isOpen = authFlow.stage !== "idle";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (authFlow.stage === "location") {
      await submitLocation({ city: city.trim(), state, country: "India" });
    } else if (authFlow.stage === "phone") {
      await submitPhone(phone);
    } else if (authFlow.stage === "otp") {
      await verifyOtp(otp);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cancelAuth()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {authFlow.stage === "location"
              ? "Confirm your location"
              : authFlow.stage === "phone"
              ? "Verify your mobile"
              : authFlow.stage === "otp"
              ? "Enter verification code"
              : "Preparing secure login"}
          </DialogTitle>
          <DialogDescription>
            {authFlow.stage === "otp"
              ? `We sent a code by ${authFlow.method} to ${authFlow.destination}.`
              : "Your region determines the required verification method."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {authFlow.stage === "location" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="auth-city">Exact city</Label>
                <Input
                  id="auth-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-state">State</Label>
                <Input
                  id="auth-state"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  list="indian-states"
                  required
                />
                <datalist id="indian-states">
                  {southernStates.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </>
          )}

          {authFlow.stage === "phone" && (
            <div className="space-y-2">
              <Label htmlFor="auth-phone">Registered mobile number</Label>
              <Input
                id="auth-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
          )}

          {authFlow.stage === "otp" && (
            <div className="space-y-2">
              <Label htmlFor="auth-otp">6-digit OTP</Label>
              <Input
                id="auth-otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, ""))
                }
                required
                autoFocus
              />
            </div>
          )}

          {authFlow.error && (
            <p className="text-sm text-red-600">{authFlow.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancelAuth}>
              Cancel
            </Button>
            {!["loading", "idle"].includes(authFlow.stage) && (
              <Button type="submit" disabled={authFlow.loading}>
                {authFlow.loading ? "Please wait..." : "Continue"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
