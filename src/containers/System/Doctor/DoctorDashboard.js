import React, { Component } from 'react';
import { connect } from "react-redux";
import './DoctorDashboard.scss';
import { getAllPatientForDoctor } from '../../../services/userService';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import { NavLink } from 'react-router-dom';
import ViewHistoryModal from './ViewHistoryModal';

class DoctorDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            todayPatients: [],
            completedPatients: [],
            totalPatientsThisMonth: 0,
            totalEarningsThisMonth: 0,
            isLoading: true,
            isOpenHistoryModal: false,
            selectedPatientId: null,
            selectedPatientName: ''
        }
    }

    handleOpenHistoryModal = (patientId, patientName) => {
        this.setState({
            isOpenHistoryModal: true,
            selectedPatientId: patientId,
            selectedPatientName: patientName
        });
    }

    handleCloseHistoryModal = () => {
        this.setState({
            isOpenHistoryModal: false,
            selectedPatientId: null,
            selectedPatientName: ''
        });
    }

    async componentDidMount() {
        this.loadDashboardData();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.user !== this.props.user) {
            this.loadDashboardData();
        }
    }

    loadDashboardData = async () => {
        let { user } = this.props;
        if (!user || !user.id) {
            this.setState({ isLoading: false });
            return;
        }
        this.setState({ isLoading: true });
        try {
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

            // Get all patients to extract the completed checkups history (statusId = S3)
            let resAll = await getAllPatientForDoctor({
                doctorId: user.id,
                date: 'all'
            });

            let completedPatients = [];
            if (resAll && resAll.errCode === 0 && resAll.data) {
                completedPatients = resAll.data.filter(item => item.statusId === 'S3');
            }

            this.setState({
                todayPatients: todayPatients,
                completedPatients: completedPatients,
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
        let { todayPatients, completedPatients, isLoading } = this.state;
        let { language, user } = this.props;

        let pendingToday = todayPatients.filter(p => p.statusId === 'S1').length;
        let confirmedToday = todayPatients.filter(p => p.statusId === 'S2').length;
        let completedToday = todayPatients.filter(p => p.statusId === 'S3').length;

        return (
            <div className="doctor-dashboard-container">
                <div className="welcome-banner">
                    <div className="welcome-content">
                        <h2>{language === LANGUAGES.VI ? 'Chào mừng trở lại' : 'Welcome back'}, Dr. {user ? user.firstName : ''}!</h2>
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
                                        let time = language === LANGUAGES.VI ? item.timeTypeDataPatient?.valueVi : item.timeTypeDataPatient?.valueEn;
                                        return (
                                            <div className="appointment-item" key={index}>
                                                <div className="time">
                                                    <i className="far fa-clock"></i> {time || ''}
                                                </div>
                                                <div className="patient-info">
                                                    <div className="name">{item.patientData?.firstName || ''} {item.patientData?.lastName || ''}</div>
                                                    <div className="contact"><i className="fas fa-phone"></i> {item.patientData?.phonenumber || ''}</div>
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

                <div className="dashboard-widgets-history" style={{ marginTop: '25px' }}>
                    <div className="widget patient-history-widget" style={{ width: '100%', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: 0 }}>
                                <i className="fas fa-history" style={{ marginRight: '8px', color: '#4caf50' }}></i>
                                {language === LANGUAGES.VI ? 'Lịch sử bệnh nhân đã khám xong' : 'Examined Patients History'}
                            </h3>
                            <span className="record-count" style={{ background: '#e8f5e9', color: '#4caf50', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                                {language === LANGUAGES.VI ? `Tổng: ${completedPatients.length} bệnh nhân` : `Total: ${completedPatients.length} patients`}
                            </span>
                        </div>
                        <div className="widget-body">
                            {isLoading ? (
                                <div className="loading-spinner" style={{ textAlign: 'center', padding: '20px' }}><i className="fas fa-spinner fa-spin"></i></div>
                            ) : completedPatients.length > 0 ? (
                                <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Ngày khám' : 'Date'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Thời gian' : 'Time'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Họ và tên' : 'Full Name'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Số điện thoại' : 'Phone'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Địa chỉ' : 'Address'}</th>
                                                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#495057' }}>{language === LANGUAGES.VI ? 'Hành động' : 'Actions'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedPatients.map((item, index) => {
                                                let dateStr = item.date ? moment(Number(item.date)).format('DD/MM/YYYY') : '—';
                                                let time = language === LANGUAGES.VI ? item.timeTypeDataPatient?.valueVi : item.timeTypeDataPatient?.valueEn;
                                                let patientFullName = item.patientData ? `${item.patientData.lastName || ''} ${item.patientData.firstName || ''}`.trim() : '—';
                                                return (
                                                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                        <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                                                        <td style={{ padding: '12px 8px', fontWeight: '500' }}>{dateStr}</td>
                                                        <td style={{ padding: '12px 8px' }}>
                                                            <span style={{ background: '#e3f2fd', color: '#0d47a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{time || ''}</span>
                                                        </td>
                                                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1565c0' }}>
                                                            {patientFullName}
                                                        </td>
                                                        <td style={{ padding: '12px 8px' }}>{item.patientData?.phonenumber || '—'}</td>
                                                        <td style={{ padding: '12px 8px', color: '#6c757d' }}>{item.patientData?.address || '—'}</td>
                                                        <td style={{ padding: '12px 8px' }}>
                                                            <button 
                                                                className="btn btn-primary btn-sm"
                                                                style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                                                                onClick={() => this.handleOpenHistoryModal(item.patientId, patientFullName)}
                                                            >
                                                                <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>
                                                                {language === LANGUAGES.VI ? 'Xem bệnh án' : 'View Record'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-data" style={{ textAlign: 'center', padding: '30px 10px', color: '#6c757d' }}>
                                    <i className="far fa-folder-open" style={{ fontSize: '2rem', marginBottom: '10px', color: '#ced4da' }}></i>
                                    <p style={{ margin: 0 }}>{language === LANGUAGES.VI ? 'Chưa có bệnh nhân nào được khám xong.' : 'No examined patients history available.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ViewHistoryModal
                    isOpen={this.state.isOpenHistoryModal}
                    closeModal={this.handleCloseHistoryModal}
                    patientId={this.state.selectedPatientId}
                    patientName={this.state.selectedPatientName}
                />
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
