import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ResetPassword from "..pages/ResetPassword.js";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

const renderComponent = (token = "mock-token") => {
  // simulate ?token=mock-token in URL
  window.history.pushState({}, "", `/reset-password?token=${token}`);

  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );
};

describe("ResetPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders reset password form correctly", () => {
    renderComponent();

    expect(screen.getByText(/Set new password/i)).toBeInTheDocument();
    expect(screen.getByText(/Must be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset password/i })).toBeInTheDocument();
  });

  test("shows error if passwords do not match", async () => {
    renderComponent();

    const newPasswordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm password/i);
    const submitButton = screen.getByRole("button", { name: /Reset password/i });

    fireEvent.change(newPasswordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "Mismatch123!" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test("shows validation error for weak password", async () => {
    renderComponent();

    const newPasswordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm password/i);
    const submitButton = screen.getByRole("button", { name: /Reset password/i });

    fireEvent.change(newPasswordInput, { target: { value: "abc" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "abc" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  test("shows success message on successful password reset", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "Password reset successfully" },
    });

    renderComponent();

    const newPasswordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm password/i);
    const submitButton = screen.getByRole("button", { name: /Reset password/i });

    fireEvent.change(newPasswordInput, { target: { value: "StrongPass123!" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "StrongPass123!" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Password changed Successfully/i)).toBeInTheDocument();
  });

  test("shows error message on failed API request", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: "Invalid token" } },
    });

    renderComponent();

    const newPasswordInput = screen.getByLabelText(/Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm password/i);
    const submitButton = screen.getByRole("button", { name: /Reset password/i });

    fireEvent.change(newPasswordInput, { target: { value: "StrongPass123!" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "StrongPass123!" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Invalid token/i)).toBeInTheDocument();
  });

  test("displays invalid token message if token is missing", () => {
    renderComponent(null);

    expect(screen.getByText(/Invalid or missing token/i)).toBeInTheDocument();
  });
});