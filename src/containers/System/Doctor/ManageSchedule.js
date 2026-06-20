import React, { Component } from 'react';
import { connect } from "react-redux";
import './ManageSchedule.scss';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';
import * as actions from "../../../store/actions";
import { CRUD_ACTIONS, LANGUAGES, dateFormat } from "../../../utils";
import DatePicker from '../../../components/Input/DatePicker';
import moment from 'moment';
import { toast } from "react-toastify";
import _ from 'lodash';
import { saveBulkScheduleDoctor, getScheduleDoctorByDate, deleteScheduleDoctor, getAllScheduleDoctor } from '../../../services/userService';

class ManageSchedule extends Component {
    constructor(props) {
        super(props);

        this.state = {
            listDoctors: [],
            selectedDoctors: {},
            currentDate: '',
            rangeTime: [],
            doctorSchedules: [],

        }
    }

    componentDidMount() {
        this.props.fetchALLDoctors();
        this.props.fetchAllScheduleTime();
        this.fetchAllSchedule();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.allDoctors !== this.props.allDoctors) {
            let dataSelect = this.buildDataInputSelect(this.props.allDoctors)
            this.setState({
                listDoctors: dataSelect
            })
        }

        if (prevProps.allScheduleTime !== this.props.allScheduleTime) {
            //console.log('check range: ', this.props.allScheduleTime);
            let data = this.props.allScheduleTime;
            if (data && data.length > 0) {
                // data.map(item => {
                //     item.isSelected = false;
                //     return item;
                // })
                data = data.map(item => ({ ...item, isSelected: false }))
            }
            //console.log('check range data: ', data);
            this.setState({
                rangeTime: data
            })
        }
        // if (prevProps.language !== this.props.language) {
        //     let dataSelect = this.buildDataInputSelect(this.props.allDoctors)
        //     this.setState({
        //         listDoctors: dataSelect
        //     })
        // }
    }

    buildDataInputSelect = (inputData) => {
        let result = [];
        let { language } = this.props;
        if (inputData && inputData.length > 0) {
            inputData.map((item, index) => {
                let object = {};
                let labelVi = `${item.lastName} ${item.firstName}`;
                let labelEn = `${item.firstName} ${item.lastName}`;
                object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                object.value = item.id;
                result.push(object)
            })
        }
        return result;
    }

    handleChangeSelect = async (selectedDoctor) => {
        await this.setState({ selectedDoctors: selectedDoctor });
        this.resetRangeTimeSelection();
        this.fetchDoctorSchedule();
    };

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        });
        this.resetRangeTimeSelection();
        this.fetchDoctorSchedule();
    }

    handleClickBtnTime = (time) => {
        let { rangeTime } = this.state;
        if (this.isTimeSlotInPast(time)) return; // Skip if slot has passed
        //console.log('check rangetime before: ', rangeTime)
        if (rangeTime && rangeTime.length > 0) {
            rangeTime = rangeTime.map(item => {
                if (item.id === time.id) item.isSelected = !item.isSelected;
                return item;
            })
            //console.log('check rangetime after: ', rangeTime)
            this.setState({
                rangeTime: rangeTime
            })
        }
    }

    isTimeSlotInPast = (item) => {
        if (!this.state.currentDate) return false;

        let selectedDate = moment(this.state.currentDate).startOf('day');
        let today = moment().startOf('day');

        // If selected date is before today, all slots are in the past
        if (selectedDate.isBefore(today)) {
            return true;
        }

        // If selected date is after today, no slots are in the past
        if (selectedDate.isAfter(today)) {
            return false;
        }

        // If selected date is today, parse start time of the slot and compare with now
        let timeStr = item.valueVi;
        if (!timeStr) return false;

        let parts = timeStr.split('-');
        if (parts.length > 0) {
            let startPart = parts[0].trim();
            let timeParts = startPart.split(':');
            if (timeParts.length === 2) {
                let hour = parseInt(timeParts[0], 10);
                let minute = parseInt(timeParts[1], 10);

                let slotTime = moment().hour(hour).minute(minute).second(0).millisecond(0);
                return moment().isAfter(slotTime);
            }
        }
        return false;
    }

    resetRangeTimeSelection = () => {
        let { rangeTime } = this.state;
        if (rangeTime && rangeTime.length > 0) {
            let clearedRangeTime = rangeTime.map(item => ({ ...item, isSelected: false }));
            this.setState({
                rangeTime: clearedRangeTime
            });
        }
    }

    handleSaveSchedule = async () => {
        let { rangeTime, selectedDoctors, currentDate } = this.state;
        let result = [];

        if (!currentDate) {
            toast.error("Ngày chọn không hợp lệ!");
            return;
        }
        if (selectedDoctors && _.isEmpty(selectedDoctors)) {
            toast.error("Vui lòng chọn bác sĩ!");
            return;
        }

        // let formattedDate = moment(currentDate).format(dateFormat.SEND_TO_SERVER);
        // let formattedDate = moment(currentDate).unix();
        let formattedDate = new Date(currentDate).getTime();

        if (rangeTime && rangeTime.length > 0) {
            let selectedTime = rangeTime.filter(item => item.isSelected === true);
            // Filter out any selected slots that are in the past
            selectedTime = selectedTime.filter(item => !this.isTimeSlotInPast(item));

            if (selectedTime && selectedTime.length > 0) {
                selectedTime.map((schedule, index) => {
                    // console.log('schedule: ', schedule, index, selectedDoctors)
                    let object = {};
                    object.doctorId = selectedDoctors.value;
                    object.date = formattedDate;
                    object.timeType = schedule.keyMap;
                    result.push(object)
                })

            } else {
                toast.error("Vui lòng chọn khung giờ khám!");
                return;
            }
        }
        let res = await saveBulkScheduleDoctor({
            arrSchedule: result,
            doctorId: selectedDoctors.value,
            formattedDate: formattedDate
        })
        if (res && res.errCode === 0) {
            toast.success("Lưu thông tin lịch khám thành công!");
            this.resetRangeTimeSelection();
            await this.fetchDoctorSchedule();
        } else {
            toast.error("Lưu thông tin lịch khám thất bại!");
            //console.log('error saveBulkScheduleDoctor >>> res: ', res)
        }
    }

    fetchDoctorSchedule = async () => {
        let { selectedDoctors, currentDate } = this.state;

        if (!selectedDoctors || !currentDate) return;

        let date = new Date(currentDate).getTime();

        let res = await getScheduleDoctorByDate(selectedDoctors.value, date);

        if (res && res.errCode === 0) {
            this.setState({
                doctorSchedules: res.data || []
            });
        } else {
            this.setState({
                doctorSchedules: []
            });
        }
    };

    handleDeleteSchedule = async (schedule) => {
        try {
            let res = await deleteScheduleDoctor(schedule.id);

            if (res && res.errCode === 0) {
                toast.success("Xóa lịch thành công!");

                // 🔥 luôn reload lại danh sách đang hiển thị
                await this.fetchDoctorSchedule();

            } else {
                toast.error(res?.errMessage || "Xóa thất bại!");
            }

        } catch (e) {
            console.error(e);
            toast.error("Lỗi server khi xóa!");
        }
    };

    fetchAllSchedule = async () => {
        let res = await getAllScheduleDoctor();

        if (res && res.errCode === 0) {
            this.setState({
                doctorSchedules: res.data || []
            });
        } else {
            this.setState({
                doctorSchedules: []
            });
        }
    };

    render() {
        //console.log('check state: ', this.state);
        let { rangeTime, doctorSchedules } = this.state;
        let { language } = this.props;
        let yesterday = new Date(new Date().setDate(new Date().getDate() - 1));

        return (
            <div className='manage-schedule-container container-fluid'>
                {/* Form Card */}
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-calendar-days me-2"></i>
                                    <FormattedMessage id="manage-schedule.title" />
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Thiết lập và phân bổ lịch khám bệnh cho các bác sĩ trong hệ thống' : 'Configure and allocate scheduling for system doctors'}
                                </p>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="row g-3 border-top pt-4">
                            <div className='col-md-6 col-sm-12'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="manage-schedule.choose-doctor" /></label>
                                <Select
                                    value={this.state.selectedDoctors}
                                    onChange={this.handleChangeSelect}
                                    options={this.state.listDoctors}
                                    isClearable
                                />
                            </div>
                            <div className='col-md-6 col-sm-12'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id="manage-schedule.choose-date" /></label>
                                <DatePicker
                                    onChange={this.handleOnchangeDatePicker}
                                    className='form-control'
                                    value={this.state.currentDate}
                                    minDate={yesterday}
                                />
                            </div>
                            
                            <div className='col-12 pick-hour-container d-flex flex-wrap gap-2 mt-4'>
                                {rangeTime && rangeTime.length > 0 &&
                                    rangeTime.map((item, index) => {
                                        return (
                                            <button className={`btn btn-sm btn-schedule rounded-pill px-3 py-2 ${item.isSelected === true ? 'active' : ''}`}
                                                key={index}
                                                onClick={() => this.handleClickBtnTime(item)}
                                                disabled={this.isTimeSlotInPast(item)}
                                            >
                                                {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                            </button>
                                        )
                                    })
                                }
                            </div>
                            
                            <div className='col-12 mt-4'>
                                <div className='d-flex justify-content-end'>
                                    <button className='btn btn-sm btn-admin rounded-pill px-4'
                                        onClick={() => this.handleSaveSchedule()}
                                    >
                                        <i className="fa-solid fa-save me-1"></i>
                                        <FormattedMessage id="manage-schedule.save-information" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedules List Card */}
                <div className="card shadow-sm border-0 rounded-3">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-list me-2"></i>
                                    <FormattedMessage id="manage-schedule.created-schedule" defaultMessage="Lịch khám đã tạo" />
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    Tổng số: {doctorSchedules ? doctorSchedules.length : 0} lịch khám
                                </p>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th style={{ width: '80px' }}>STT</th>
                                        <th>Bác sĩ</th>
                                        <th>Ngày khám</th>
                                        <th>Giờ khám</th>
                                        <th className="text-center" style={{ width: '120px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctorSchedules && doctorSchedules.length > 0 ? (
                                        doctorSchedules.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>{index + 1}</td>
                                                <td className="fw-bold text-dark">
                                                    {item.doctorData
                                                        ? (language === LANGUAGES.VI
                                                            ? `${item.doctorData.lastName} ${item.doctorData.firstName}`
                                                            : `${item.doctorData.firstName} ${item.doctorData.lastName}`)
                                                        : ''}
                                                </td>
                                                <td>
                                                    {item.date
                                                        ? moment(Number(item.date)).format('DD/MM/YYYY')
                                                        : '---'}
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border p-1 px-2 small">
                                                        {language === LANGUAGES.VI
                                                            ? item.timeTypeData?.valueVi || ''
                                                            : item.timeTypeData?.valueEn || ''}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-danger px-2 rounded-pill"
                                                            onClick={() => this.handleDeleteSchedule(item)}
                                                            title="Xóa"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-secondary">
                                                <i className="fas fa-calendar-times fa-2x mb-3 text-muted"></i>
                                                <p className="mb-0">Chưa có lịch khám</p>
                                            </td>
                                        </tr>
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
        isLoggedIn: state.user.isLoggedIn,
        allDoctors: state.admin.allDoctors,
        language: state.app.language,
        allScheduleTime: state.admin.allScheduleTime,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchALLDoctors: () => dispatch(actions.fetchALLDoctors()),
        fetchAllScheduleTime: () => dispatch(actions.fetchAllScheduleTime()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageSchedule);
