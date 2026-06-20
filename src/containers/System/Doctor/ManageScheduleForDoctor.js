import React, { Component } from 'react';
import { connect } from "react-redux";
import moment from 'moment';
import { LANGUAGES } from "../../../utils";
import { getScheduleDoctorByDate } from "../../../services/userService";
import DatePicker from '../../../components/Input/DatePicker';
import { toast } from "react-toastify";
import './ManageScheduleForDoctor.scss';

class ManageScheduleForDoctor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: moment(new Date()).startOf('day').valueOf(),
            schedules: [],
            isLoading: false
        }
    }

    componentDidMount() {
        this.fetchDoctorSchedule();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.userInfo !== this.props.userInfo) {
            this.fetchDoctorSchedule();
        }
    }

    fetchDoctorSchedule = async () => {
        this.setState({ isLoading: true });
        try {
            let { userInfo } = this.props;
            let { currentDate } = this.state;

            if (!userInfo || !userInfo.id) return;

            let date = currentDate ? new Date(currentDate).getTime() : '';

            let res = await getScheduleDoctorByDate(userInfo.id, date);

            if (res && res.errCode === 0) {
                this.setState({
                    schedules: res.data || []
                });
            } else {
                toast.error("Không thể tải lịch khám");
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            toast.error("Lỗi tải lịch khám");
        }
        this.setState({ isLoading: false });
    }

    handleChangeDate = (date) => {
        this.setState(
            { currentDate: date[0] },
            async () => await this.fetchDoctorSchedule()
        );
    }

    handleClearDate = () => {
        this.setState({
            currentDate: ''
        }, async () => {
            await this.fetchDoctorSchedule();
        });
    }

    render() {
        let { schedules, currentDate, isLoading } = this.state;
        let { language } = this.props;

        let stats = {
            total: schedules.length,
            morning: schedules.filter(s => {
                let type = s.timeType;
                return ['T1', 'T2', 'T3', 'T4'].includes(type);
            }).length,
            afternoon: schedules.filter(s => {
                let type = s.timeType;
                return !['T1', 'T2', 'T3', 'T4'].includes(type);
            }).length
        };

        return (
            <div className="manage-schedule-doctor-container container-fluid">
                {/* Header & Stats Card */}
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-12">
                                <h4 className="text-doctor font-weight-bold mb-0">
                                    <i className="fa-solid fa-calendar-days me-2"></i>
                                    {language === LANGUAGES.VI ? 'Lịch khám của tôi' : 'My Schedule'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Xem và quản lý các ca khám bệnh đã đăng ký' : 'View and manage registered medical examination shifts'}
                                </p>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-4">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-doctor-light text-doctor rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-list-check"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.total}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Tổng ca khám' : 'Total Shifts'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-4">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-warning-light text-warning rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-sun"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.morning}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Ca sáng' : 'Morning'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-4">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-primary-light text-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-cloud-sun"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.afternoon}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Ca chiều' : 'Afternoon'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="row g-3 align-items-end border-top pt-4">
                            <div className="col-md-4 col-sm-6">
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Chọn ngày xem lịch' : 'Select Date'}</label>
                                <div className="d-flex gap-2">
                                    <DatePicker
                                        className="form-control"
                                        value={currentDate}
                                        onChange={this.handleChangeDate}
                                    />
                                    {currentDate && (
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            onClick={this.handleClearDate} 
                                            title={language === LANGUAGES.VI ? 'Xóa bộ lọc ngày' : 'Clear date filter'}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="card shadow-sm border-0 rounded-3">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-doctor font-weight-bold mb-0">
                                    <i className="fa-solid fa-clock me-2"></i>
                                    {language === LANGUAGES.VI ? 'Danh sách thời gian khám' : 'Schedule Timetable'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? `Tổng số: ${schedules.length} ca` : `Total: ${schedules.length} shifts`}
                                </p>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th style={{ width: '80px' }}>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Ngày khám' : 'Date'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Giờ khám' : 'Time Shift'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4">
                                                <i className="fa-solid fa-spinner fa-spin me-2 text-doctor"></i>
                                                {language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}
                                            </td>
                                        </tr>
                                    ) : schedules.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4 text-muted">
                                                {language === LANGUAGES.VI ? 'Chưa có lịch khám nào' : 'No schedules found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        schedules.map((item, index) => (
                                            <tr key={item.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold text-dark">
                                                        <i className="fa-solid fa-calendar me-2 text-doctor"></i>
                                                        {moment(Number(item.date)).format('DD/MM/YYYY')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary-light text-primary border border-primary-subtle p-2">
                                                        <i className="fa-regular fa-clock me-1"></i>
                                                        {language === LANGUAGES.VI
                                                            ? item.timeTypeData?.valueVi
                                                            : item.timeTypeData?.valueEn}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        userInfo: state.user.userInfo
    };
};

export default connect(mapStateToProps)(ManageScheduleForDoctor);
