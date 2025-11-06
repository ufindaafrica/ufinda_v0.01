import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Buttons'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import '../styles/resetPassword.css'
import Background from '../assets/Backgroundimage'
import onReset from '../assets/Onreset'
import onSuccess from '../assets/Onsuccess'

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [status, setStatus] = useState({
        message: "",
        type: ""
    });
    const [loading, setLoading] = useState(false);
    const [isSuccess, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState({
        newPassword: false,
        confirmPassword: false,
    });
    const [passwordStrength, setPasswordStrength] = useState({
        level: "",
        progress: 0,
        color: ''
    });

    useEffect(() => {
        if (!token) {
            setStatus({
                message: "Invalid or missing token",
                type: "error"
            });
        }
    }, [token]);

    const calculatePasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        let level = 'weak';
        let color = 'bg-red-500';
        if (score >= 5) {
            level = 'Strong';
            color = 'bg-green-500';
        } else if (score >= 3) {
            level = 'Medium';
            color = 'bg-yellow-500';
        }

        const progress = (score / 5) * 100;
        return {level, progress, color};
    };

    const validatePasswordStrength = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'password must conatin at least one upperCase letter.'
        }
        if (!/[a-z]/.test(password)) {
            return 'password must conatin at least one lowerCase letter.'
        }
        if (!/[0-9]/.test(password)) {
            return 'password must conatin at least one number.'
        }
        if (!/[A-Za-z0-9]/.test(password)) {
            return 'password must conatin at least one special character.'
        }
        return null;
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'newPassword') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
    };

    const toggleVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({
                message: "Passwords do not match.",
                type: "error"
            });
            return;
        }

        const strengthError = validatePasswordStrength(formData.newPassword);
        if (strengthError) {
            setStatus({
                message: strengthError,
                type: "error"
            });
            return;
        }

        try {
            const response = await axios.post(process.env.BACKEND_URI, {
                Token: token,
                NewPassword: formData.newPassword,
            });

            setStatus({
                message: response.data.message,
                type: "success",
            });
            setSuccess(true);
        } catch (error) {
            const errmsg = error.response?.data?.error || "Ouch! Something went wrong. Try again.";
            setStatus({
                message: errmsg,
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-100 px-3'>
                <div className='bg-white shadow-md rounded-2xl p-8 w-full max-w-md text-center'>
                    <img
                      src={onSuccess}
                      alt="a key and a hour glass"
                      className='mx-auto mb-4'
                      width={200}/>
                    <h2 className='text-2xl font-semibold mb-2'>Password changed Succesfully</h2>
                    <p className='text-gray-600 mb-6'>Your password reset was succesful, please go back to the app to login</p>
                </div>
            </div>
        )
    }
  return (
    <div className='reset-container'>
        <div className="reset-r">
            <img src={Background} alt="image shows a 3d render" className="reset-bg" />
        </div>
        <div className='reset-l'>
            <img src={onReset} alt="image shows a  padlock illustration" className="reset-l-img/>
            <h2 className='reset-title'>Reset Your Password</h2>
            {status.message && (
                <p className={`reset-para ${status.type === 'error' ? 'error-msg' : 'success'}`}>
                    {status.message}
                </p>
            )}

            <form onSubmit={handleSubmit} className='space-y-5'>
                {/* new password */}
                <div className="password-form">
                    <label className='block text-gray'>New password</label>
                      <input
                          type={showPassword.newPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          required
                          className='w-full border border-gray-300 rounded-lg px-3 py2 pr-10 focus:ring-blue-400'
                      />
                      <button
                          type='button'
                          onClick={() => toggleVisibility('newPassword')}
                          className='absolute right-3 top-8 text-gray-500'>
                          {showPassword.newPassword ? <EyeOff size={24} /> : <Eye size={20} />}
                      </button>
                </div>

                {formData.newPassword && (
                    <div className="mt-2">
                        <div className='w-full bg-gray-200 rounded-full h-2.5'>
                            <div
                              className={`h-2.5 rounded-full ${passwordStrength.color}`}
                              style={{ width: `${passwordStrength.progress}%` }}></div>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>{passwordStrength.level}</p>
                    </div>
                )}

                {/* confirm new password */}
                <div className="relative">
                    <label className='block text-gray-600 mb-1'>Confirm Password</label>
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className='w-full border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400' 
                    />
                    <button
                        type='button'
                        onClick={() => toggleVisibility('newPassword')}
                        className='absolute right-3 top-8 text-gray-500'>
                        {showPassword.newPassword ? <EyeOff size={24} /> : <Eye size={20} />}
                    </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !token}
                  className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all'
                >
                    {loading ? "updating..." : "Reset Password"}
                </Button>
            </form>
        </div>
    </div>
  )
};

export default ResetPassword