import React, { Component } from "react";
import { connect } from "react-redux";
import "./HomeHeader.scss";
import { withRouter } from 'react-router';
import { path } from '../../utils';
class HomeHeader extends Component {

    returnToHome = () => {
        if (this.props.history) {
            this.props.history.push(`/home`);
        }
    }

    render() {
        let language = this.props.language;
        return (
            <React.Fragment>
                <header className="home-header-container">
                    <div className="home-header-content">
                        <a
                            href="/home"
                            className="header-logo"
                            onClick={(e) => { e.preventDefault(); this.returnToHome(); }}
                        >
                            <span>CareDirect</span>
                        </a>

                        <nav className="header-nav">
                            <a
                                className="nav-link active"
                                href="/home"
                                onClick={(e) => { e.preventDefault(); this.returnToHome(); }}
                            >
                                Trang chủ
                            </a>
                            <a className="nav-link" href="/doctors"
                                onClick={(e) => { e.preventDefault(); this.props.history.push(path.ALL_DOCTORS); }}>
                                Bác sĩ
                            </a>
                            <a className="nav-link" href="/facilities"
                                onClick={(e) => {
                                    e.preventDefault();
                                    this.props.history.push(path.ALL_CLINICS);
                                }}>
                                Cơ sở y tế
                            </a>
                            <a className="nav-link" href="/appointments"
                                onClick={(e) => { e.preventDefault(); this.props.history.push(path.APPOINTMENTS); }}>
                                Lịch hẹn
                            </a>
                        </nav>

                        <div className="header-actions">
                            <a href="/booking-flow" className="btn-primary">
                                Đặt lịch ngay
                            </a>
                            <button
                                className="mobile-menu-toggle"
                                aria-label="Mở menu"
                                aria-expanded="false"
                            >
                                <i className="fa-solid fa-bars"></i>
                            </button>
                        </div>
                    </div>
                </header>
                {this.props.isShowBanner === true &&
                    <div className="home-header-banner">
                        <div className="content-up">
                            <div className="title1">Nền tảng y tế chăm sóc sức khỏe toàn diện</div>
                            <div className="title2">Kết nối bệnh nhân với bác sĩ và cơ sở y tế hàng đầu</div>
                            <div className="search">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input type="text" placeholder="Tìm chuyên khoa khám bệnh" />
                            </div>
                        </div>
                        <div className="content-down">
                            <div className="options">
                                <div className="option-child">
                                    <div className="icon-child"><i class="fa-solid fa-hospital"></i></div>
                                    <div className="text-child">Khám chuyên khoa</div>
                                </div>
                                <div className="option-child">
                                    <div className="icon-child"><i className="fa-solid fa-mobile-screen"></i></div>
                                    <div className="text-child">Khám từ xa</div>
                                </div>
                                <div className="option-child">
                                    <div className="icon-child"><i className="fa-solid fa-bed"></i></div>
                                    <div className="text-child">Khám tổng quát</div>
                                </div>
                                <div className="option-child">
                                    <div className="icon-child"><i className="fa-solid fa-microscope"></i></div>
                                    <div className="text-child">Xét nghiệm y học</div>
                                </div>
                                <div className="option-child">
                                    <div className="icon-child"><i className="fa-solid fa-user-doctor"></i></div>
                                    <div className="text-child">Sức khỏe tinh thần</div>
                                </div>
                                <div className="option-child">
                                    <div className="icon-child"><i className="fa-solid fa-tooth"></i></div>
                                    <div className="text-child">Khám nha khoa</div>
                                </div>
                            </div>
                        </div>

                    </div>
                }
            </React.Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.user.isLoggedIn,
});

export default withRouter(connect(mapStateToProps)(HomeHeader));
