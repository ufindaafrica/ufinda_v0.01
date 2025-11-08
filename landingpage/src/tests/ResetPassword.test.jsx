import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import ResetPassword from "../pages/resetPassword";

// Mock axios
jest.mock("axios");

describe("ResetPassword Component", () => {
  beforeEach(() => {
    axios.post.mockResolvedValue({
      data: { message: "Password updated successfully" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders form correctly with token available, handles input, strength meter, submission, and shows success screen", async () => {
    // Mockurl with token: ufinda/reset?token=access-token
    render(
      <MemoryRouter initialEntries={["/reset?token=access-token"]}>
        <Routes>
          <Route path="/reset" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    //Checking form for error (token is available)
    expect(screen.getByText("Reset your Password")).toBeInTheDocument();
    expect(
      screen.queryByText("Invalid or missing reset token")
    ).not.toBeInTheDocument();

    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", {
      name: /Reset password/i,
    });

    // Checking password validation
    fireEvent.change(newPasswordInput, {
      target: { value: "StrongPass1" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "StrongPass1" },
    });

    // Testing strength meter real time update
    await waitFor(() => {
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    // Testing password visibilty toggle button
    const toggleNewPwd = screen.getAllByRole("button", { name: "" })[0];
    fireEvent.click(toggleNewPwd);
    expect(newPasswordInput.type).toBe("text");

    // Submitting the form
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    // Testing API call and success screen
    await waitFor(() => {
      expect(screen.getByText("Password Changed!")).toBeInTheDocument();
    });
    expect(
    screen.getByText("You have successfully reset your password")
    ).toBeInTheDocument();
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/reset-password",
      { token: "access-token", newPassword: "StrongPass1" }
    );
    expect(
    screen.getByRole("link", { name: "Login now" })
    ).toBeInTheDocument();
  });
});
