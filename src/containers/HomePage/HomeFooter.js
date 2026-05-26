import React, { Component } from "react";
import { connect } from "react-redux";
import './HomeFooter.scss';


class HomeFooter extends Component {

    render() {

        return (
            <footer className="home-footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-column">
                            <div className="footer-logo">CareDirect</div>
                            <p className="footer-description">
                                Nền tảng đặt lịch khám bệnh hàng đầu Việt Nam, kết nối hàng triệu
                                bệnh nhân với đội ngũ bác sĩ uy tín.
                            </p>
                        </div>

                        <div className="footer-column">
                            <h5 className="footer-title">Thông tin</h5>
                            <ul className="footer-links">
                                <li><a href="/facilities">Hệ thống phòng khám</a></li>
                                <li><a href="/doctors">Danh sách bác sĩ</a></li>
                                <li><a href="/booking-flow">Đặt lịch khám</a></li>
                                <li><a href="/appointments">Quản lý lịch hẹn</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h5 className="footer-title">Hỗ trợ</h5>
                            <ul className="footer-links">
                                <li className="footer-link-item">Hotline: 1-800-CARE</li>
                                <li className="footer-link-item">Chính sách bảo mật</li>
                                <li className="footer-link-item">Điều khoản dịch vụ</li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h5 className="footer-title">Nhận tin</h5>
                            <div className="newsletter-form">
                                <input
                                    className="newsletter-input"
                                    placeholder="Email của bạn"
                                    type="email"
                                />
                                <button className="newsletter-btn">Gửi</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-container">
                        <p className="copyright">
                            &copy; 2024 CareDirect Healthcare. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn
});

const mapDispatchToProps = dispatch => {
    return {

    };
};


export default connect(mapStateToProps, mapDispatchToProps)(HomeFooter);
