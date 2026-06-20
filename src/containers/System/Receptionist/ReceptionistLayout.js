import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink, withRouter } from 'react-router-dom';
import * as actions from "../../../store/actions";
import { LANGUAGES } from '../../../utils';
import NotificationDropdown from '../NotificationDropdown';
import './ReceptionistLayout.scss';

class ReceptionistLayout extends Component {

    handleChangeLanguages = (language) => {
        this.props.changeLanguageAppRedux(language);
    }

    getPageTitle = () => {
        const { location, language } = this.props;
        const path = location.pathname;
        const isVi = language === LANGUAGES.VI;

        if (path.includes('check-in')) return isVi ? 'Tiếp Nhận & Đo Chỉ Số' : 'Check-in & Vitals';
        if (path.includes('manage-patient')) return isVi ? 'Hồ Sơ Bệnh Nhân' : 'Patient Management';
        if (path.includes('manage-booking')) return isVi ? 'Đặt Lịch Hẹn Khám' : 'Schedule Appointments';
        if (path.includes('billing')) return isVi ? 'Thanh Toán & Hóa Đơn' : 'Billing & Checkout';
        return isVi ? 'Quầy Lễ Tân' : 'Reception Dashboard';
    }

    render() {
        const { processLogout, language, userInfo, children } = this.props;
        const isVi = language === LANGUAGES.VI;

        let imageUrl = '';
        if (userInfo && userInfo.image) {
            let img = userInfo.image;
            if (img.startsWith('data:') || img.startsWith('http')) {
                imageUrl = img;
            } else {
                try {
                    imageUrl = `data:image/jpeg;base64,${btoa(img)}`;
                } catch (e) {
                    imageUrl = img;
                }
            }
        }

        return (
            <div className="receptionist-layout-container">
                {/* Sidebar */}
                <aside className="receptionist-sidebar">
                    <div className="sidebar-header">
                        <div className="logo-icon">
                            <i className="fas fa-clipboard-check"></i>
                        </div>
                        <div className="brand-name">Reception Portal</div>
                    </div>

                    <div className="receptionist-profile-summary">
                        <div 
                            className="avatar" 
                            style={{ backgroundImage: `url(${imageUrl || 'https://ui-avatars.com/api/?name=Reception&background=6b21a8&color=fff'})` }}
                        ></div>
                        <div className="receptionist-name">
                            {userInfo?.firstName} {userInfo?.lastName}
                        </div>
                        <div className="receptionist-role">
                            <i className="fas fa-user-tag"></i>
                            {isVi ? 'Lễ tân / Y tế' : 'Receptionist'}
                        </div>
                    </div>

                    <div className="sidebar-menu">
                        <NavLink to="/receptionist/check-in" className="menu-item" activeClassName="active">
                            <i className="fas fa-id-card"></i>
                            {isVi ? 'Tiếp nhận bệnh nhân' : 'Patient Check-in'}
                        </NavLink>
                        <NavLink to="/receptionist/manage-patient" className="menu-item" activeClassName="active">
                            <i className="fas fa-user-injured"></i>
                            {isVi ? 'Hồ sơ bệnh nhân' : 'Patient Directory'}
                        </NavLink>
                        <NavLink to="/receptionist/manage-booking" className="menu-item" activeClassName="active">
                            <i className="far fa-calendar-plus"></i>
                            {isVi ? 'Quản lý lịch hẹn' : 'Book Appointments'}
                        </NavLink>
                        <NavLink to="/receptionist/billing" className="menu-item" activeClassName="active">
                            <i className="fas fa-file-invoice-dollar"></i>
                            {isVi ? 'Thanh toán & Hóa đơn' : 'Billing Desk'}
                        </NavLink>
                    </div>

                    <div className="sidebar-footer">
                        <div className="btn-logout" onClick={processLogout}>
                            <i className="fas fa-sign-out-alt"></i>
                            {isVi ? 'Đăng xuất' : 'Logout'}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="receptionist-main-content">
                    <header className="receptionist-topbar">
                        <div className="topbar-left">
                            <h2 className="page-title">{this.getPageTitle()}</h2>
                        </div>
                        <div className="topbar-right">
                            <NavLink to="/home" className="topbar-home-btn" title={isVi ? 'Về trang chủ' : 'Go to homepage'}>
                                <i className="fas fa-home"></i>
                            </NavLink>
                            <div className="language-switch">
                                <span 
                                    className={language === LANGUAGES.VI ? "active" : ""}
                                    onClick={() => this.handleChangeLanguages(LANGUAGES.VI)}
                                >
                                    VN
                                </span>
                                |
                                <span 
                                    className={language === LANGUAGES.EN ? "active" : ""}
                                    onClick={() => this.handleChangeLanguages(LANGUAGES.EN)}
                                >
                                    EN
                                </span>
                            </div>
                            <div className="notification-icon">
                                <NotificationDropdown role="receptionist" />
                            </div>
                        </div>
                    </header>

                    <div className="receptionist-page-content">
                        {children}
                    </div>
                </main>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        userInfo: state.user.userInfo,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        processLogout: () => dispatch(actions.processLogout()),
        changeLanguageAppRedux: (language) => dispatch(actions.changeLanguageApp(language))
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ReceptionistLayout));
