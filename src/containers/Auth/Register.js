import React, { Component } from "react";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { handleRegisterApi } from "../../services/userService";
import "./Register.scss";
import HomeHeader from "../HomePage/HomeHeader";
import HomeFooter from "../HomePage/HomeFooter";

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            errMessage: "",
            isLoading: false
        };
    }

    handleOnChange = (field, event) => {
        this.setState({
            [field]: event.target.value
        });
    };

    handleRegister = async () => {
        this.setState({ errMessage: "" });

        const { email, password, confirmPassword, fullName } = this.state;

        // validate FE
        if (!email || !password || !confirmPassword || !fullName) {
            this.setState({ errMessage: "Vui lòng nhập đầy đủ thông tin" });
            return;
        }

        if (password !== confirmPassword) {
            this.setState({ errMessage: "Mật khẩu không khớp" });
            return;
        }

        try {
            this.setState({ isLoading: true });

            let res = await handleRegisterApi({
                email,
                password,
                fullName
            });

            if (res && res.errCode !== 0) {
                this.setState({
                    errMessage: res.errMessage || "Đăng ký thất bại"
                });
            }

            if (res && res.errCode === 0) {
                alert("Đăng ký thành công!");
                this.props.navigate("/login");
            }
        } catch (e) {
            this.setState({
                errMessage: "Lỗi server"
            });
        } finally {
            this.setState({ isLoading: false });
        }
    };

    render() {
        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />
                <div className="register-background">
                    <div className="register-container">
                        <div className="register-content row">

                            <div className="col-12 text-register">
                                Đăng ký
                            </div>

                            <div className="col-12 register-input">
                                <label>Họ và Tên</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={this.state.fullName}
                                    onChange={(e) => this.handleOnChange("fullName", e)}
                                    placeholder='Nhập họ và tên'
                                />
                            </div>

                            <div className="col-12 register-input">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={this.state.email}
                                    onChange={(e) => this.handleOnChange("email", e)}
                                    placeholder='Nhập email'
                                />
                            </div>

                            <div className="col-12 register-input">
                                <label>Mật khẩu</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={this.state.password}
                                    onChange={(e) => this.handleOnChange("password", e)}
                                    placeholder='Nhập mật khẩu'
                                />
                            </div>

                            <div className="col-12 register-input">
                                <label>Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={this.state.confirmPassword}
                                    onChange={(e) => this.handleOnChange("confirmPassword", e)}
                                    placeholder='Xác nhận lại mật khẩu'
                                />
                            </div>

                            <div className="col-12" style={{ color: "red" }}>
                                {this.state.errMessage}
                            </div>

                            <div className="col-12">
                                <button
                                    className="btn-register"
                                    onClick={this.handleRegister}
                                    disabled={this.state.isLoading}
                                >
                                    Đăng ký
                                </button>
                            </div>

                            <div className="col-12 text-center mt-3">
                                <span
                                    className="back-login"
                                    onClick={() => this.props.navigate("/login")}
                                >
                                    Bạn đã có tài khoản? Đăng nhập
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
                <HomeFooter />
            </React.Fragment>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        navigate: (path) => dispatch(push(path))
    };
};

export default connect(null, mapDispatchToProps)(Register);