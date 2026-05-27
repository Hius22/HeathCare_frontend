import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink, withRouter } from 'react-router-dom';
import * as actions from "../../../store/actions";
import { LANGUAGES } from '../../../utils';
import NotificationDropdown from '../NotificationDropdown';
import './DoctorLayout.scss';

class DoctorLayout extends Component {

    handleChangeLanguages = (language) => {
        this.props.changeLanguageAppRedux(language);
    }

    getPageTitle = () => {
        const { location, language } = this.props;
        const path = location.pathname;
        
        if (path.includes('dashboard')) return language === LANGUAGES.VI ? 'Tổng Quan' : 'Dashboard';
        if (path.includes('manage-schedule')) return language === LANGUAGES.VI ? 'Quản Lý Lịch Khám' : 'Manage Schedule';
        if (path.includes('manage-patient')) return language === LANGUAGES.VI ? 'Quản Lý Bệnh Nhân' : 'Manage Patients';
        if (path.includes('profile')) return language === LANGUAGES.VI ? 'Hồ Sơ Của Tôi' : 'My Profile';
        return '';
    }

    render() {
        const { processLogout, language, userInfo, children } = this.props;
        
        let imageUrl = '';
        if (userInfo && userInfo.image) {
            let img = userInfo.image;
            // If it's already a data URL or http URL, use as-is
            if (img.startsWith('data:') || img.startsWith('http')) {
                imageUrl = img;
            } else {
                // Backend decoded from base64 to binary string — re-encode to data URL
                try {
                    let base64 = btoa(img);
                    imageUrl = `data:image/jpeg;base64,${base64}`;
                } catch (e) {
                    // If btoa fails (e.g. unicode chars), try using as-is
                    imageUrl = img;
                }
            }
        }

        return (
            <div className="doctor-layout-container">
                {/* Sidebar */}
                <aside className="doctor-sidebar">
                    <div className="sidebar-header">
                        <div className="logo-icon">
                            <i className="fas fa-hospital"></i>
                        </div>
                        <div className="brand-name">Doctor Portal</div>
                    </div>

                    <div className="doctor-profile-summary">
                        <div 
                            className="avatar" 
                            style={{ backgroundImage: `url(${imageUrl || 'https://via.placeholder.com/150'})` }}
                        ></div>
                        <div className="doctor-name">
                            {language === LANGUAGES.VI ? `Bs. ${userInfo?.firstName} ${userInfo?.lastName}` : `Dr. ${userInfo?.firstName} ${userInfo?.lastName}`}
                        </div>
                        <div className="doctor-role">
                            <i className="fas fa-stethoscope"></i>
                            {language === LANGUAGES.VI ? 'Bác sĩ chuyên khoa' : 'Specialist Doctor'}
                        </div>
                    </div>

                    <div className="sidebar-menu">
                        <NavLink to="/doctor/dashboard" className="menu-item" activeClassName="active">
                            <i className="fas fa-chart-line"></i>
                            {language === LANGUAGES.VI ? 'Tổng quan' : 'Dashboard'}
                        </NavLink>
                        <NavLink to="/doctor/manage-schedule-doctor" className="menu-item" activeClassName="active">
                            <i className="far fa-calendar-alt"></i>
                            {language === LANGUAGES.VI ? 'Lịch khám' : 'Schedule'}
                        </NavLink>
                        <NavLink to="/doctor/manage-patient" className="menu-item" activeClassName="active">
                            <i className="fas fa-user-injured"></i>
                            {language === LANGUAGES.VI ? 'Bệnh nhân' : 'Patients'}
                        </NavLink>
                        <NavLink to="/doctor/profile" className="menu-item" activeClassName="active">
                            <i className="far fa-id-badge"></i>
                            {language === LANGUAGES.VI ? 'Hồ sơ của tôi' : 'My Profile'}
                        </NavLink>
                    </div>

                    <div className="sidebar-footer">
                        <div className="btn-logout" onClick={processLogout}>
                            <i className="fas fa-sign-out-alt"></i>
                            {language === LANGUAGES.VI ? 'Đăng xuất' : 'Logout'}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="doctor-main-content">
                    <header className="doctor-topbar">
                        <div className="topbar-left">
                            <h2 className="page-title">{this.getPageTitle()}</h2>
                        </div>
                        <div className="topbar-right">
                            <NavLink to="/home" className="topbar-home-btn" title={language === LANGUAGES.VI ? 'Về trang chủ' : 'Go to homepage'}>
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
                                <NotificationDropdown role="doctor" />
                            </div>
                        </div>
                    </header>

                    <div className="doctor-page-content">
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DoctorLayout));
