import React, { Component } from "react";
import { connect } from "react-redux";
import "./HomeHeader.scss";

const MenuIcon = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
);

const CloseIcon = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const NAV_ITEMS = [
    { id: "home", label: "Trang chủ" },
    { id: "technology", label: "Công nghệ hiện đại" },
    { id: "treatments", label: "Bệnh điều trị" },
    { id: "testimonials", label: "Cảm nhận khách hàng" },
    { id: "doctor-team", label: "Đội ngũ bác sĩ" },
    { id: "medical-records", label: "Hồ sơ số" },
    { id: "support", label: "Trung tâm hỗ trợ" }
];

class HomeHeader extends Component {
    state = {
        isMenuOpen: false,
        currentPage: "home",
    };

    handleNavigation = (page) => {
        this.setState({ currentPage: page, isMenuOpen: false });
    };

    handleLogout = () => {
        this.setState({ isMenuOpen: false });
    };

    toggleMobileMenu = () => {
        this.setState((prev) => ({ isMenuOpen: !prev.isMenuOpen }));
    };

    render() {
        const { isLoggedIn } = this.props;
        const { isMenuOpen, currentPage } = this.state;

        return (
            <header className="hc-header">
                <div className="hc-header__inner">

                    {/* Logo */}
                    <div className="hc-brand" onClick={() => this.handleNavigation("home")}>
                        <div className="hc-brand__mark">H+</div>
                        <div>
                            <div className="hc-brand__name">HealthCare+</div>
                            <small>Active Care Platform</small>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hc-nav">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                className={currentPage === item.id ? "active" : ""}
                                onClick={() => this.handleNavigation(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                        <button>Chat AI</button>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="hc-auth">
                        {isLoggedIn ? (
                            <>
                                <button className="outline" onClick={() => this.handleNavigation("profile")}>
                                    Tài khoản
                                </button>
                                <button className="primary" onClick={() => this.handleNavigation("booking")}>
                                    Đặt lịch khám
                                </button>
                                <button className="ghost" onClick={this.handleLogout}>
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="outline" onClick={() => this.handleNavigation("login")}>
                                    Đăng nhập
                                </button>
                                <button className="primary" onClick={() => this.handleNavigation("register")}>
                                    Đăng ký
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button className="hc-mobile-toggle" onClick={this.toggleMobileMenu}>
                        {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="hc-mobile-menu">

                        {NAV_ITEMS.map((item) => (
                            <button key={item.id} onClick={() => this.handleNavigation(item.id)}>
                                {item.label}
                            </button>
                        ))}

                        <button>Chat AI / Hotline</button>

                        <div className="hc-mobile-groups">
                            <h4>Giải pháp nhanh</h4>
                            <ul>
                                <li>
                                    <button onClick={() => this.handleNavigation("booking")}>Đặt lịch khám</button>
                                </li>
                                <li>
                                    <button onClick={() => this.handleNavigation("doctor-team")}>Tìm bác sĩ</button>
                                </li>
                            </ul>
                        </div>

                        <div className="hc-mobile-actions">
                            {isLoggedIn ? (
                                <>
                                    <button className="outline" onClick={() => this.handleNavigation("profile")}>
                                        Tài khoản
                                    </button>
                                    <button className="primary" onClick={() => this.handleNavigation("booking")}>
                                        Đặt lịch khám
                                    </button>
                                    <button className="ghost" onClick={this.handleLogout}>
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => this.handleNavigation("login")}>Đăng nhập</button>
                                    <button className="primary" onClick={() => this.handleNavigation("register")}>
                                        Đăng ký ngay
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>
        );
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.user.isLoggedIn,
    //userInfo: state.user.userInfo,
});

export default connect(mapStateToProps)(HomeHeader);
