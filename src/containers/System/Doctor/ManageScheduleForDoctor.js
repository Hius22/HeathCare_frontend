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
                // Determine if morning based on timeType (T1, T2, T3, T4 usually)
                let type = s.timeType;
                return ['T1', 'T2', 'T3', 'T4'].includes(type);
            }).length,
            afternoon: schedules.filter(s => {
                let type = s.timeType;
                return !['T1', 'T2', 'T3', 'T4'].includes(type);
            }).length
        };

        return (
            <div className="manage-schedule-doctor-container">
                <div className="manage-schedule-header">
                    <h2>
                        <i className="fa-solid fa-calendar-days"></i>
                        {language === LANGUAGES.VI ? 'Lịch khám của tôi' : 'My Schedule'}
                    </h2>
                </div>

                <div className="stats-cards">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">
                            <i className="fa-solid fa-list-check"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Tổng ca khám' : 'Total Shifts'}</div>
                        </div>
                    </div>
                    <div className="stat-card stat-morning">
                        <div className="stat-icon" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                            <i className="fa-solid fa-sun"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.morning}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Ca sáng' : 'Morning'}</div>
                        </div>
                    </div>
                    <div className="stat-card stat-afternoon">
                        <div className="stat-icon" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                            <i className="fa-solid fa-cloud-sun"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.afternoon}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Ca chiều' : 'Afternoon'}</div>
                        </div>
                    </div>
                </div>

                <div className="schedule-filters">
                    <div className="filter-group">
                        <label>{language === LANGUAGES.VI ? 'Chọn ngày xem lịch' : 'Select Date'}</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <DatePicker
                                className="form-control"
                                value={currentDate}
                                onChange={this.handleChangeDate}
                            />
                            {currentDate && (
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={this.handleClearDate} 
                                    title={language === LANGUAGES.VI ? 'Xóa bộ lọc ngày' : 'Clear date filter'}
                                    style={{ padding: '0 15px', borderRadius: '8px', border: 'none', background: '#e0e0e0', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="schedules-table-container">
                    <div className="table-header-bar">
                        <h3><i className="fas fa-clock"></i> {language === LANGUAGES.VI ? 'Danh Sách Thời Gian Khám' : 'Schedule Timetable'}</h3>
                        <span className="record-count">{language === LANGUAGES.VI ? `Tổng: ${schedules.length} ca` : `Total: ${schedules.length} shifts`}</span>
                    </div>

                    {isLoading ? (
                        <div className="loading">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>{language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</span>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="no-data">
                            <i className="fa-solid fa-calendar-xmark"></i>
                            <p>{language === LANGUAGES.VI ? 'Chưa có lịch khám nào' : 'No schedules found'}</p>
                        </div>
                    ) : (
                        <table className="schedules-table">
                            <thead>
                                <tr>
                                    <th>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Ngày khám' : 'Date'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Giờ khám' : 'Time Shift'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((item, index) => (
                                    <tr key={item.id} className="schedule-row">
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="date-info">
                                                <i className="fa-solid fa-calendar"></i> {moment(Number(item.date)).format('DD/MM/YYYY')}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="time-badge">
                                                <i className="fa-regular fa-clock"></i>
                                                {language === LANGUAGES.VI
                                                    ? item.timeTypeData?.valueVi
                                                    : item.timeTypeData?.valueEn}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        userInfo: state.user.userInfo // doctor đang đăng nhập
    };
};

export default connect(mapStateToProps)(ManageScheduleForDoctor);
