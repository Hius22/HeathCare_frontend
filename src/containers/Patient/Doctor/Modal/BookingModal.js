import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './BookingModal.scss';
import { Modal } from 'reactstrap';
import ProfileDoctor from '../ProfileDoctor';
import _ from "lodash";
import DatePicker from '../../../../components/Input/DatePicker';
import * as actions from '../../../../store/actions';
import { LANGUAGES } from '../../../../utils';
import Select from 'react-select';
import { postPatientBookingAppointment } from '../../../../services/userService';
import { toast } from "react-toastify";
import moment from 'moment';

class BookingModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            fullName: '',
            phoneNumber: '',
            email: '',
            address: '',
            reason: '',
            birthday: '',
            selectedGender: '',
            doctorId: '',
            timeType: '',
            genders: '',
        }
    }

    async componentDidMount() {
        this.props.getGenders();

    }

    buildDataGender = (data) => {
        let result = [];
        let language = this.props.language;

        if (data && data.length > 0) {
            data.map(item => {
                let object = {};
                object.label = language === LANGUAGES.VI ? item.valueVi : item.valueEn;
                object.value = item.keyMap;
                result.push(object)
            })
        }
        return result;
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {
            this.setState({
                genders: this.buildDataGender(this.props.genders)
            })
        }

        if (this.props.genders !== prevProps.genders) {
            this.setState({
                genders: this.buildDataGender(this.props.genders)
            })
        }

        if (this.props.dataTime !== prevProps.dataTime) {
            if (this.props.dataTime && !_.isEmpty(this.props.dataTime)) {
                let doctorId = this.props.dataTime.doctorId;
                let timeType = this.props.dataTime.timeType;
                this.setState({
                    doctorId: doctorId,
                    timeType: timeType
                })
            }
        }

    }

    handleOnChangeInput = (event, id) => {
        let valueInput = event.target.value;
        let stateCopy = { ...this.state };
        stateCopy[id] = valueInput;
        this.setState({
            ...stateCopy
        })
    }

    handleOnchangeDatePicker = (date) => {
        this.setState({
            birthday: date[0]
        })
    }

    handleChangeSelect = (selectedDoctor) => {
        this.setState({ selectedGender: selectedDoctor });
    }

    buildTimeBooking = (dataTime) => {
        let { language } = this.props;

        if (dataTime && !_.isEmpty(dataTime)) {
            // Xử lý ngày
            let date =
                language === LANGUAGES.VI
                    ? moment.unix(+dataTime.date / 1000).locale('vi').format('dddd - DD/MM/YYYY')
                    : moment.unix(+dataTime.date / 1000).locale('en').format('dddd - MM/DD/YYYY');

            // Xử lý giờ
            let time =
                language === LANGUAGES.VI
                    ? dataTime.timeTypeData.valueVi
                    : dataTime.timeTypeData.valueEn;

            return `${time} - ${date}`
        }
        return ''
    };

    buildDoctorName = (dataTime) => {
        let { language } = this.props;

        if (dataTime && !_.isEmpty(dataTime)) {
            let name = language === LANGUAGES.VI ?
                `${dataTime.doctorData.lastName} ${dataTime.doctorData.firstName}`
                :
                `${dataTime.doctorData.firstName} ${dataTime.doctorData.lastName}`

            return name;
        }
        return ''
    }

    handleConfirmBooking = async () => {
        //validate input
        let date = this.state.birthday ? new Date(this.state.birthday).getTime() : '';
        let timeString = this.buildTimeBooking(this.props.dataTime);
        let doctorName = this.buildDoctorName(this.props.dataTime);

        // Validate required fields
        if (!this.state.fullName || !this.state.phoneNumber || !this.state.email
            || !this.state.address || !this.state.reason || !date
            || !this.state.selectedGender) {
            toast.error('Please fill in all required fields!');
            return;
        }

        // Validate email format
        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.state.email)) {
            toast.error('Invalid email format!');
            return;
        }

        let res = await postPatientBookingAppointment({
            fullName: this.state.fullName,
            phoneNumber: this.state.phoneNumber,
            email: this.state.email,
            address: this.state.address,
            reason: this.state.reason,
            date: this.props.dataTime.date,
            birthday: date,
            selectedGender: this.state.selectedGender ? this.state.selectedGender.value : '',
            doctorId: this.state.doctorId,
            timeType: this.state.timeType,
            language: this.props.language,
            timeString: timeString,
            doctorName: doctorName
        })

        if (res && res.errCode === 0) {
            toast.success("Successfully booked an appointment!");
            this.props.closeBookingClose();
        }
        else if (res && res.errCode === 2) {
            toast.error("This appointment already exists!");
        }
        else {
            toast.error("Failed to make an appointment!");
        }
    }

    render() {
        let { isOpenModal, closeBookingClose, dataTime } = this.props;
        let doctorId = '';
        if (dataTime && !_.isEmpty(dataTime)) {
            doctorId = dataTime.doctorId
        }

        return (
            <Modal
                isOpen={isOpenModal}
                className={'booking-modal-container'}
                size='lg'
                centered
            >
                <div className='booking-modal-content'>
                    <div className='booking-modal-header'>
                        <span className='left'>
                            <i className="fa-solid fa-calendar-check header-icon"></i>
                            <FormattedMessage id="patient.booking-modal.title" />
                        </span>
                        <span onClick={closeBookingClose} className='close-btn'>
                            <i className="fa-solid fa-xmark"></i>
                        </span>
                    </div>

                    <div className='booking-modal-body'>
                        <div className='doctor-infor'>
                            <ProfileDoctor
                                doctorId={doctorId}
                                isShowDescriptionDoctor={false}
                                dataTime={dataTime}
                                isShowLinkDetail={false}
                                isShowPrice={true}
                            />
                        </div>

                        <div className='booking-form'>
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.fullName" />
                                        <span className='required'>*</span>
                                    </label>
                                    <input
                                        className='form-input'
                                        type='text'
                                        placeholder='Nhập họ và tên'
                                        value={this.state.fullName}
                                        onChange={(event) => this.handleOnChangeInput(event, 'fullName')}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.phoneNumber" />
                                        <span className='required'>*</span>
                                    </label>
                                    <input
                                        className='form-input'
                                        type='tel'
                                        placeholder='0901234567'
                                        value={this.state.phoneNumber}
                                        onChange={(event) => this.handleOnChangeInput(event, 'phoneNumber')}
                                    />
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.email" />
                                        <span className='required'>*</span>
                                    </label>
                                    <input
                                        className='form-input'
                                        type='email'
                                        placeholder='example@email.com'
                                        value={this.state.email}
                                        onChange={(event) => this.handleOnChangeInput(event, 'email')}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.address" />
                                        <span className='required'>*</span>
                                    </label>
                                    <input
                                        className='form-input'
                                        type='text'
                                        placeholder='Nhập địa chỉ'
                                        value={this.state.address}
                                        onChange={(event) => this.handleOnChangeInput(event, 'address')}
                                    />
                                </div>
                            </div>

                            <div className='form-group full-width'>
                                <label className='form-label'>
                                    <FormattedMessage id="patient.booking-modal.reason" />
                                    <span className='required'>*</span>
                                </label>
                                <input
                                    className='form-input'
                                    type='text'
                                    placeholder='Mô tả ngắn gọn tình trạng sức khỏe...'
                                    value={this.state.reason}
                                    onChange={(event) => this.handleOnChangeInput(event, 'reason')}
                                />
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.birthday" />
                                        <span className='required'>*</span>
                                    </label>
                                    <DatePicker
                                        onChange={this.handleOnchangeDatePicker}
                                        className='form-input date-picker'
                                        value={this.state.birthday}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label className='form-label'>
                                        <FormattedMessage id="patient.booking-modal.gender" />
                                        <span className='required'>*</span>
                                    </label>
                                    <Select
                                        value={this.state.selectedGender}
                                        onChange={this.handleChangeSelect}
                                        options={this.state.genders}
                                        placeholder={this.props.language === LANGUAGES.VI ? "Chọn giới tính" : "Select gender"}
                                        className='react-select-container'
                                        classNamePrefix='react-select'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='booking-modal-footer'>
                        <button
                            className='btn-cancel'
                            onClick={closeBookingClose}
                        >
                            <FormattedMessage id="patient.booking-modal.cancel" />
                        </button>
                        <button
                            className='btn-confirm'
                            onClick={() => this.handleConfirmBooking()}
                        >
                            <i className="fa-solid fa-check"></i>
                            <FormattedMessage id="patient.booking-modal.confirm" />
                        </button>
                    </div>
                </div>
            </Modal >
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        genders: state.admin.genders,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        getGenders: () => dispatch(actions.fetchGenderStart()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(BookingModal);
