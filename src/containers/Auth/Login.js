import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from "connected-react-router";
import * as actions from "../../store/actions";
import './Login.scss';
import { handleLoginApi } from '../../services/userService';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            isShowPassword: false,
            errMessage: '',
        }
    }

    handleOnChangeUsername = (event) => {
        this.setState({ username: event.target.value });
    }

    handleOnChangePassword = (event) => {
        this.setState({ password: event.target.value });
    }

    handleLogin = async () => {
        this.setState({ errMessage: '' });
        try {
            let data = await handleLoginApi(this.state.username, this.state.password);
            if (data && data.errCode !== 0) {
                this.setState({ errMessage: data.message });
            }
            if (data && data.errCode === 0) {
                this.props.userLoginSuccess(data.user);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                this.setState({ errMessage: error.response.data.message });
            }
        }
    }

    handleShowHidePassword = () => {
        this.setState({ isShowPassword: !this.state.isShowPassword });
    }

    handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            this.handleLogin();
        }
    }

    render() {
        return (
            <div className="login-background">

                {/* LEFT — Brand Panel */}
                <div className="login-brand-panel">
                    <div className="brand-logo">
                        <div className="logo-icon">
                            <i className="fas fa-heartbeat"></i>
                        </div>
                        <div className="logo-text">
                            Health<span>Care+</span>
                        </div>
                    </div>

                    <div className="brand-illustration">
                        <i className="fas fa-user-md"></i>
                    </div>

                    <h2 className="brand-title">Hệ thống quản lý<br />y tế thông minh</h2>
                    <p className="brand-subtitle">
                        Kết nối bệnh nhân với đội ngũ y bác sĩ chuyên nghiệp. Đặt lịch khám nhanh chóng, tiện lợi và an toàn.
                    </p>

                    <div className="brand-features">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <span>Đặt lịch<br />nhanh</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <span>Bảo mật<br />tuyệt đối</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <i className="fas fa-stethoscope"></i>
                            </div>
                            <span>Bác sĩ<br />chuyên môn</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Form Panel */}
                <div className="login-form-panel">
                    <div className="login-header">
                        <h2>Chào mừng trở lại 👋</h2>
                        <p>Vui lòng đăng nhập vào tài khoản của bạn</p>
                    </div>

                    {/* Email / Username */}
                    <div className="form-group-custom">
                        <label>Tên đăng nhập</label>
                        <div className="input-wrapper">
                            <i className="fas fa-user input-icon"></i>
                            <input
                                id="login-username"
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={this.state.username}
                                onChange={this.handleOnChangeUsername}
                                onKeyDown={this.handleKeyDown}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-group-custom">
                        <label>Mật khẩu</label>
                        <div className="input-wrapper">
                            <i className="fas fa-lock input-icon"></i>
                            <input
                                id="login-password"
                                type={this.state.isShowPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={this.state.password}
                                onChange={this.handleOnChangePassword}
                                onKeyDown={this.handleKeyDown}
                            />
                            <span className="toggle-password" onClick={this.handleShowHidePassword}>
                                <i className={this.state.isShowPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}></i>
                            </span>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <span className="forgot-password">Quên mật khẩu?</span>
                    </div>

                    {/* Error */}
                    {this.state.errMessage && (
                        <div className="err-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {this.state.errMessage}
                        </div>
                    )}

                    {/* Submit */}
                    <button id="login-btn" className="btn-login" onClick={this.handleLogin}>
                        <i className="fas fa-sign-in-alt"></i>
                        Đăng nhập
                    </button>

                    {/* Divider */}
                    <div className="divider">
                        <div className="line"></div>
                        <span>Hoặc tiếp tục với</span>
                        <div className="line"></div>
                    </div>

                    {/* Social */}
                    <div className="social-login">
                        <button className="social-btn google">
                            <i className="fa-brands fa-google"></i>
                            Google
                        </button>
                        <button className="social-btn facebook">
                            <i className="fa-brands fa-facebook-f"></i>
                            Facebook
                        </button>
                    </div>

                    <div className="login-footer">
                        Chưa có tài khoản? <span className="link">Liên hệ quản trị viên</span>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {
        navigate: (path) => dispatch(push(path)),
        userLoginSuccess: (userInfor) => dispatch(actions.userLoginSuccess(userInfor))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
