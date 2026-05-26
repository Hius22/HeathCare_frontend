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
        this.fetchDoctorSchedule();

    };

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        });
        this.fetchDoctorSchedule();
    }

    handleClickBtnTime = (time) => {
        let { rangeTime } = this.state;
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

    handleSaveSchedule = async () => {
        let { rangeTime, selectedDoctors, currentDate } = this.state;
        let result = [];

        if (!currentDate) {
            toast.error("Invalid date! ");
            return;
        }
        if (selectedDoctors && _.isEmpty(selectedDoctors)) {
            toast.error("Invalid selected doctor! ");
            return;
        }

        // let formattedDate = moment(currentDate).format(dateFormat.SEND_TO_SERVER);
        // let formattedDate = moment(currentDate).unix();
        let formattedDate = new Date(currentDate).getTime();

        if (rangeTime && rangeTime.length > 0) {
            let selectedTime = rangeTime.filter(item => item.isSelected === true)
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
                toast.error("Invalid selected time! ");
                return;
            }
        }
        let res = await saveBulkScheduleDoctor({
            arrSchedule: result,
            doctorId: selectedDoctors.value,
            formattedDate: formattedDate
        })
        if (res && res.errCode === 0) {
            toast.success("Information saved as!");
            await this.fetchDoctorSchedule();
        } else {
            toast.error("error saveBulkScheduleDoctor");
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
            <div className='manage-schedule-container'>
                <div className='title'>
                    <FormattedMessage id="manage-schedule.title" />
                </div>
                
                <div className='manage-schedule-body'>
                    <div className='container'>
                        <div className='row'>
                            <div className='col-6 form-group'>
                                <label><FormattedMessage id="manage-schedule.choose-doctor" /></label>
                                <Select
                                    value={this.state.selectedDoctors}
                                    onChange={this.handleChangeSelect}
                                    options={this.state.listDoctors}
                                />
                            </div>
                            <div className='col-6 form-group'>
                                <label><FormattedMessage id="manage-schedule.choose-date" /></label>
                                <DatePicker
                                    onChange={this.handleOnchangeDatePicker}
                                    className='form-control'
                                    value={this.state.currentDate}
                                    minDate={yesterday}
                                />
                            </div>
                            <div className='col-12 pick-hour-container'>
                                {rangeTime && rangeTime.length > 0 &&
                                    rangeTime.map((item, index) => {
                                        return (
                                            <button className={item.isSelected === true ? 'btn btn-schedule active' : 'btn btn-schedule'}
                                                key={index}
                                                onClick={() => this.handleClickBtnTime(item)}
                                            >
                                                {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                            </button>
                                        )
                                    })
                                }
                            </div>
                            <div className='col-12'>
                                <button className='btn btn-primary btn-save-schedule'
                                    onClick={() => this.handleSaveSchedule()}
                                >
                                    <FormattedMessage id="manage-schedule.save-information" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h3><i className="fas fa-calendar-alt"></i> <FormattedMessage id="manage-schedule.created-schedule" defaultMessage="Lịch khám đã tạo" /></h3>
                        <span className="schedule-count">Tổng: {doctorSchedules ? doctorSchedules.length : 0} lịch</span>
                    </div>

                    <div className="table-wrapper">
                        <table id='TableManageSchedule'>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Bác sĩ</th>
                                    <th>Ngày khám</th>
                                    <th>Giờ khám</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctorSchedules && doctorSchedules.length > 0 ? (
                                    doctorSchedules.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td>{index + 1}</td>
                                            <td className="doctor-name">
                                                {item.doctorData
                                                    ? (language === LANGUAGES.VI
                                                        ? `${item.doctorData.lastName} ${item.doctorData.firstName}`
                                                        : `${item.doctorData.firstName} ${item.doctorData.lastName}`)
                                                    : ''}
                                            </td>
                                            <td className="date-cell">
                                                {item.date
                                                    ? moment(Number(item.date)).format('DD/MM/YYYY')
                                                    : '---'}
                                            </td>
                                            <td className="time-cell">
                                                {language === LANGUAGES.VI
                                                    ? item.timeTypeData.valueVi
                                                    : item.timeTypeData.valueEn}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-delete"
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
                                        <td colSpan="5" className="empty-message">
                                            <i className="fas fa-calendar-times"></i>
                                            <p>Chưa có lịch khám</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
