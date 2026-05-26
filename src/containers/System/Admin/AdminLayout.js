import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink, withRouter } from 'react-router-dom';
import * as actions from "../../../store/actions";
import { LANGUAGES } from '../../../utils';
import './AdminLayout.scss';

class AdminLayout extends Component {

    handleChangeLanguages = (language) => {
        this.props.changeLanguageAppRedux(language);
    }

    getPageTitle = () => {
        const { location, language } = this.props;
        const path = location.pathname;
        const isVi = language === LANGUAGES.VI;

        if (path.includes('manage-users'))      return isVi ? 'Quản Lý Người Dùng' : 'User Management';
        if (path.includes('manage-doctor'))    return isVi ? 'Quản Lý Bác Sĩ' : 'Doctor Management';
        if (path.includes('manage-schedule'))  return isVi ? 'Quản Lý Lịch Khám' : 'Schedule Management';
        if (path.includes('manage-booking'))   return isVi ? 'Quản Lý Đặt Lịch' : 'Booking Management';
        if (path.includes('manage-clinic'))    return isVi ? 'Quản Lý Phòng Khám' : 'Clinic Management';
        if (path.includes('manage-specialty')) return isVi ? 'Quản Lý Chuyên Khoa' : 'Specialty Management';
        return isVi ? 'Hệ Thống Quản Trị' : 'Admin Dashboard';
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
                    let base64 = btoa(img);
                    imageUrl = `data:image/jpeg;base64,${base64}`;
                } catch (e) {
                    imageUrl = img;
                }
            }
        }

        return (
            <div className="admin-layout-container">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <div className="sidebar-header">
                        <div className="logo-icon">
                            <i className="fas fa-heartbeat"></i>
                        </div>
                        <div className="brand-name">Admin Portal</div>
                    </div>

                    <div className="admin-profile-summary">
                        <div
                            className="avatar"
                            style={{ backgroundImage: `url(${imageUrl || 'https://ui-avatars.com/api/?name=Admin&background=1a56db&color=fff'})` }}
                        ></div>
                        <div className="admin-name">
                            {userInfo?.firstName} {userInfo?.lastName}
                        </div>
                        <div className="admin-role">
                            <i className="fas fa-shield-alt"></i>
                            {isVi ? 'Quản trị viên' : 'Administrator'}
                        </div>
                    </div>

                    <div className="sidebar-menu">
                        <div className="menu-section-label">{isVi ? 'QUẢN LÝ' : 'MANAGEMENT'}</div>

                        <NavLink to="/system/manage-users" className="menu-item" activeClassName="active">
                            <i className="fas fa-users"></i>
                            {isVi ? 'Người dùng' : 'Users'}
                        </NavLink>

                        <NavLink to="/system/manage-doctor" className="menu-item" activeClassName="active">
                            <i className="fas fa-user-md"></i>
                            {isVi ? 'Bác sĩ' : 'Doctors'}
                        </NavLink>

                        <NavLink to="/system/manage-schedule" className="menu-item" activeClassName="active">
                            <i className="far fa-calendar-alt"></i>
                            {isVi ? 'Lịch khám' : 'Schedule'}
                        </NavLink>

                        <NavLink to="/system/manage-booking" className="menu-item" activeClassName="active">
                            <i className="fas fa-clipboard-list"></i>
                            {isVi ? 'Đặt lịch' : 'Bookings'}
                        </NavLink>

                        <div className="menu-section-label" style={{ marginTop: '8px' }}>{isVi ? 'CƠ SỞ Y TẾ' : 'MEDICAL'}</div>

                        <NavLink to="/system/manage-clinic" className="menu-item" activeClassName="active">
                            <i className="fas fa-hospital"></i>
                            {isVi ? 'Phòng khám' : 'Clinics'}
                        </NavLink>

                        <NavLink to="/system/manage-specialty" className="menu-item" activeClassName="active">
                            <i className="fas fa-stethoscope"></i>
                            {isVi ? 'Chuyên khoa' : 'Specialties'}
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
                <main className="admin-main-content">
                    <header className="admin-topbar">
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
                                <i className="far fa-bell"></i>
                            </div>
                            <div className="topbar-user">
                                <div
                                    className="topbar-avatar"
                                    style={{ backgroundImage: `url(${imageUrl || 'https://ui-avatars.com/api/?name=Admin&background=1a56db&color=fff'})` }}
                                ></div>
                                <span>{userInfo?.firstName} {userInfo?.lastName}</span>
                            </div>
                        </div>
                    </header>

                    <div className="admin-page-content">
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AdminLayout));
