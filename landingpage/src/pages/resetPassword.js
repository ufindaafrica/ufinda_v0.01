import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/Buttons'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import '../styles/resetPassword.css'
import Background from '../assets/Backgroundimage.jpg'
import onSuccess from '../assets/Onsuccess.png'
import onReset from '../assets/Onreset.png'

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        new_password: "",
        confirmPassword: "",
    });
    const [status, setStatus] = useState({
        message: "",
        type: ""
    });
    const [liveErrors, setLiveErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState({
        new_password: false,
        confirmPassword: false,
    });
    const [passwordStrength, setPasswordStrength] = useState({
        level: "",
        progress: 0,
        colorClass: ''
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

        let level = 'Weak';
        let colorClass = 'progress-weak';
        if (score >= 5) {
            level = 'Strong';
            colorClass = 'progress-strong';
        } else if (score >= 3) {
            level = 'Medium';
            colorClass = 'progress-medium';
        }

        const progress = (score / 5) * 100;
        return {level, progress, colorClass};
    };

    const getLiveValidation = (password, confirmPassword) => {
        const errors = [];
    }

    const validatePasswordStrength = (password) => {
        if (password.length < 8) {
            error.push('Password must be at least 8 characters long.');
        }
        if (!/[A-Z]/.test(password)) {
            error.push('Password must contain at least one uppercase letter.');
        }
        if (!/[a-z]/.test(password)) {
            error.push('Password must contain at least one lowercase letter.');
        }
        if (!/[0-9]/.test(password)) {
            error.push('Password must contain at least one number.');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            error.push('Password must contain at least one special character.');
        }
        return error;
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'new_password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        const liveErrs = getLiveValidation(
            newFormData.new_password,
            newformData.confirmPassword
        );
        setLiveErrors(liveErrs);
    };

    const toggleVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (liveErrors.length > 0) {
            setStatus({
                message: 'Please pass all the checks first',
                type: error
            })
        }

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

        setLoading(true);

        try {
            const response = await axios.post(process.env.BACKEND_URI/auth/reset-pwd || https://ufinda-v0-01.onrender.com/auth/reset-pwd, {
                token: token,
                new_password: formData.newPassword,
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }, { timeout: 10000 }
        );

            setStatus({
                message: response.data.message,
                type: "success",
            });
            setSuccess(true);
        } catch (error) {
            console.error('Reset Error:', error.message, error.code, error.config, error.response);
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
            <div className='success-container'>
                <div className='success-inner'>
                    <img
                      src={onSuccess}
                      alt="a key and an hourglass"
                      className='success-img'
                      width={200}/>
                    <h2 className='success-title'>Password changed Successfully</h2>
                    <p className='success-text'>Your password reset was successful, please go back to the app to login</p>
                </div>
            </div>
        )
    }
  return (
    <div className='reset-container'>
        <div className="reset-r">
            <img src={Background} alt="shows a 3d render" className="reset-bg" />
        </div>
        <div className='reset-l'>
            <img src={onReset} alt="display a padlock" className="reset-img"/>
            <h2 className='reset-title'>Set new password</h2>
            <p className='reset-subtitle'>Enter a new password</p>
            {status.message && (
                <p className={`reset-para ${status.type === 'error' ? 'error-msg' : 'success'}`}>
                    {status.message}
                </p>
            )}

            <form onSubmit={handleSubmit} className='reset-form'>
                {/* new password */}
                <div className="password-form">
                    <label className='reset-label'>Password</label>
                    <div className="reset-input">
                        <input
                          type={showPassword.newPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          required
                          className='input'
                      />
                      <button
                          type='button'
                          onClick={() => toggleVisibility('newPassword')}
                          className='eye-button'>
                          {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                      
                </div>

                {formData.newPassword && (
                    <div className="progress-wrapper">
                        <div className='progress-container'>
                            <div
                              className={`progress-bar ${passwordStrength.colorClass}`}
                              style={{ width: `${passwordStrength.progress}%` }}></div>
                        </div>
                        <p className='progress-level'>{passwordStrength.level}</p>
                    </div>
                )}

                {/* confirm new password */}
                <div className="password-form">
                    <label className='reset-label'>Confirm password</label>
                      <div className='reset-input'>
                          <input
                              type={showPassword.confirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              required
                              className='input'
                          />
                          <button
                              type='button'
                              onClick={() => toggleVisibility('confirmPassword')}
                              className='eye-button'>
                              {showPassword.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                    </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !token}
                  className='reset-button'
                >
                    {loading ? "updating..." : "Reset password"}
                </Button>
            </form>
        </div>
    </div>
  )
};

export default ResetPassword
