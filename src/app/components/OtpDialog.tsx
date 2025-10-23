"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import api from "../utils/axios";

interface OtpDialogProps {
  open: boolean;
  siteName: string;
  referer: string;
  operatorName: string;
  onClose: (token: string | null) => void;
}

export default function OtpDialog({
  open,
  siteName,
  referer,
  operatorName,
  onClose,
}: OtpDialogProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post(
        `/api/proxy?target=${encodeURIComponent(
          `${referer}/tac/api/login/otp`
        )}&header_Referer=${encodeURIComponent(referer)}`,
        {
          operatorName,
          code: otp,
        }
      );

      const token = res?.data?.data?.token || res?.data?.token;
      if (!token) throw new Error("Invalid OTP response");

      console.log(`✅ OTP success for ${siteName}`);
      onClose(token);
    } catch (err: any) {
      console.error("🔴 OTP request failed:", err);
      setError("Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose(null);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, textAlign: "center" }}>
        รหัสยืนยันสำหรับ {siteName}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            กรุณาป้อนรหัส OTP 6 หลักที่ส่งไปยังอุปกรณ์ที่ลงทะเบียนของคุณ
          </Typography>

          <TextField
            label="OTP Code"
            fullWidth
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoFocus
            slotProps={{
                input: {
                    inputMode: "numeric",
                    sx: {
                        textAlign: "center",
                        fontSize: "1.5rem",
                        letterSpacing: "0.25rem",
                        fontWeight: 600,
                    },
                },
            }}
            error={!!error}
            helperText={error || " "}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          disabled={loading}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          ส่ง
        </Button>
      </DialogActions>
    </Dialog>
  );
}
