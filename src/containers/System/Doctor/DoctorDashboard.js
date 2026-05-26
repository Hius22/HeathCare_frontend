import React, { Component } from 'react';
import { connect } from "react-redux";
import './DoctorDashboard.scss';
import { getAllPatientForDoctor } from '../../../services/userService';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import { NavLink } from 'react-router-dom';

class DoctorDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            todayPatients: [],
            totalPatientsThisMonth: 0,
            totalEarningsThisMonth: 0,
            isLoading: true
        }
    }

    async componentDidMount() {
        this.loadDashboardData();
    }

    loadDashboardData = async () => {
        this.setState({ isLoading: true });
        try {
            let { user } = this.props;
            let today = moment().startOf('day').valueOf();
            
            // Get today's patients
            let resToday = await getAllPatientForDoctor({
                doctorId: user.id,
                date: today
            });

            let todayPatients = [];
            if (resToday && resToday.errCode === 0) {
                todayPatients = resToday.data || [];
            }

            // A realistic dashboard would also fetch monthly data from a specific API
            // For now, we will simulate the month's stats or just show today's stats accurately
            // In a real application, there would be a dedicated statistics endpoint

            this.setState({
                todayPatients: todayPatients,
                isLoading: false
            });

        } catch (error) {
            console.error(error);
            this.setState({ isLoading: false });
        }
    }

    getStatusBadge = (statusId) => {
        let { language } = this.props;
        let statusConfig = {
            'S1': { label: language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending', color: '#ff9800', icon: 'fa-clock' },
            'S2': { label: language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed', color: '#2196f3', icon: 'fa-check-circle' },
            'S3': { label: language === LANGUAGES.VI ? 'Đã khám' : 'Completed', color: '#4caf50', icon: 'fa-check-double' },
            'S4': { label: language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled', color: '#f44336', icon: 'fa-times-circle' }
        };

        let config = statusConfig[statusId] || statusConfig['S1'];
        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                <i className={`fa-solid ${config.icon}`}></i> {config.label}
            </span>
        );
    }

    render() {
        let { todayPatients, isLoading } = this.state;
        let { language, user } = this.props;

        let pendingToday = todayPatients.filter(p => p.statusId === 'S1').length;
        let confirmedToday = todayPatients.filter(p => p.statusId === 'S2').length;
        let completedToday = todayPatients.filter(p => p.statusId === 'S3').length;

        return (
            <div className="doctor-dashboard-container">
                <div className="welcome-banner">
                    <div className="welcome-content">
                        <h2>{language === LANGUAGES.VI ? 'Chào mừng trở lại' : 'Welcome back'}, Dr. {user.firstName}!</h2>
                        <p>{language === LANGUAGES.VI ? 'Bạn có' : 'You have'} <strong>{todayPatients.length}</strong> {language === LANGUAGES.VI ? 'lịch hẹn trong hôm nay.' : 'appointments today.'}</p>
                        <NavLink to="/doctor/manage-patient" className="btn-view-schedule">
                            {language === LANGUAGES.VI ? 'Xem lịch chi tiết' : 'View Schedule'}
                        </NavLink>
                    </div>
                    <div className="welcome-image">
                        <i className="fas fa-user-md"></i>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-card">
                        <div className="icon pending"><i className="fas fa-calendar-plus"></i></div>
                        <div className="info">
                            <h4>{language === LANGUAGES.VI ? 'Lịch chờ xác nhận' : 'Pending'}</h4>
                            <div className="value">{pendingToday}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon confirmed"><i className="fas fa-calendar-check"></i></div>
                        <div className="info">
                            <h4>{language === LANGUAGES.VI ? 'Lịch đã xác nhận' : 'Confirmed'}</h4>
                            <div className="value">{confirmedToday}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon completed"><i className="fas fa-check-circle"></i></div>
                        <div className="info">
                            <h4>{language === LANGUAGES.VI ? 'Đã hoàn thành' : 'Completed'}</h4>
                            <div className="value">{completedToday}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon total"><i className="fas fa-users"></i></div>
                        <div className="info">
                            <h4>{language === LANGUAGES.VI ? 'Tổng số hôm nay' : 'Total Today'}</h4>
                            <div className="value">{todayPatients.length}</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-widgets">
                    <div className="widget upcoming-appointments">
                        <div className="widget-header">
                            <h3>{language === LANGUAGES.VI ? 'Lịch hẹn hôm nay' : 'Today\'s Appointments'}</h3>
                            <NavLink to="/doctor/manage-patient">{language === LANGUAGES.VI ? 'Xem tất cả' : 'View All'}</NavLink>
                        </div>
                        <div className="widget-body">
                            {isLoading ? (
                                <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i></div>
                            ) : todayPatients.length > 0 ? (
                                <div className="appointment-list">
                                    {todayPatients.map((item, index) => {
                                        let time = language === LANGUAGES.VI ? item.timeTypeDataPatient.valueVi : item.timeTypeDataPatient.valueEn;
                                        return (
                                            <div className="appointment-item" key={index}>
                                                <div className="time">
                                                    <i className="far fa-clock"></i> {time}
                                                </div>
                                                <div className="patient-info">
                                                    <div className="name">{item.patientData.firstName} {item.patientData.lastName}</div>
                                                    <div className="contact"><i className="fas fa-phone"></i> {item.patientData.phonenumber}</div>
                                                </div>
                                                <div className="status">
                                                    {this.getStatusBadge(item.statusId)}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="empty-data">
                                    <i className="far fa-calendar-times"></i>
                                    <p>{language === LANGUAGES.VI ? 'Không có lịch hẹn nào hôm nay.' : 'No appointments today.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="widget tips-widget">
                        <div className="widget-header">
                            <h3>{language === LANGUAGES.VI ? 'Ghi chú nhanh' : 'Quick Notes'}</h3>
                        </div>
                        <div className="widget-body">
                            <ul className="tips-list">
                                <li>
                                    <i className="fas fa-lightbulb"></i>
                                    <span>{language === LANGUAGES.VI ? 'Nhớ xác nhận lịch hẹn trước 30 phút để bệnh nhân chuẩn bị.' : 'Remember to confirm appointments 30 minutes in advance.'}</span>
                                </li>
                                <li>
                                    <i className="fas fa-lightbulb"></i>
                                    <span>{language === LANGUAGES.VI ? 'Bạn có thể chỉnh sửa mô tả cá nhân tại mục Hồ Sơ Của Tôi.' : 'You can edit your personal description in My Profile.'}</span>
                                </li>
                                <li>
                                    <i className="fas fa-lightbulb"></i>
                                    <span>{language === LANGUAGES.VI ? 'Gửi hóa đơn và đơn thuốc trực tiếp qua email sau khi khám xong.' : 'Send invoice and prescription directly via email after the checkup.'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        user: state.user.userInfo,
    };
};

export default connect(mapStateToProps)(DoctorDashboard);
