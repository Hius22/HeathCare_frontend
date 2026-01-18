import React, { Component } from 'react';
import { connect } from "react-redux";
import './ManagePatient.scss';
import DatePicker from '../../../components/Input/DatePicker';
import { getAllPatientForDoctor, postSendRemedy, postCancelBooking } from '../../../services/userService';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import RemedyModal from './RemedyModal';
import CancelBookingModal from './CancelBookingModal';
import { toast } from 'react-toastify';

class ManagePatient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: moment(new Date()).startOf('day').valueOf(),
            dataPatient: [],
            isOpenRemedyModal: false,
            isOpenCancelModal: false,
            dataModal: {}
        }
    }

    async componentDidMount() {
        this.getDataPatient()
    }

    getDataPatient = async () => {
        let { user } = this.props;
        let { currentDate } = this.state;
        let formattedDate = new Date(currentDate).getTime();

        let res = await getAllPatientForDoctor({
            doctorId: user.id,
            date: formattedDate
        })

        if (res && res.errCode === 0) {
            this.setState({
                dataPatient: res.data
            })
        }
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {

        }
    }

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        }, async () => {
            await this.getDataPatient()
        })
    }

    handleBtnConfirm = (item) => {
        let data = {
            doctorId: item.doctorId,
            patientId: item.patientId,
            email: item.patientData.email,
            timeType: item.timeType,
            patientName: item.patientData.firstName
        }
        this.setState({
            isOpenRemedyModal: true,
            dataModal: data,
        })
    }

    closeRemedyModal = () => {
        this.setState({
            isOpenRemedyModal: false,
            dataModal: {}
        })

    }

    sendRemedy = async (dataChild) => {
        let { dataModal } = this.state
        let res = await postSendRemedy({
            email: dataChild.email,
            imgBase64: dataChild.imgBase64,
            doctorId: dataModal.doctorId,
            patientId: dataModal.patientId,
            timeType: dataModal.timeType,
            language: this.props.language,
            patientName: dataModal.patientName
        })
        //console.log('check modal con: ', res)
        if (res && res.errCode === 0) {
            toast.success('Sent successfully');
            this.closeRemedyModal();
            await this.getDataPatient();
        }
        else {
            toast.error('Send failed');
        }
    }

    handleBtnCancel = (item) => {
        let date = moment(this.state.currentDate).startOf('day').valueOf();
        this.setState({
            isOpenCancelModal: true,
            dataModal: {
                doctorId: item.doctorId,
                patientId: item.patientId,
                timeType: item.timeType,
                date,
                email: item.patientData.email,
                patientName: item.patientData.firstName
            }
        })
    }

    cancelBooking = async (dataChild) => {
        let res = await postCancelBooking({
            ...dataChild,
            language: this.props.language
        });

        if (res && res.errCode === 0) {
            toast.success('Cancelled successfully');
            this.setState({ isOpenCancelModal: false });
            await this.getDataPatient();
        } else {
            toast.error('Cancel failed');
        }
    }

    render() {
        //console.log('this satte', this.state)
        let { dataPatient, isOpenRemedyModal, dataModal } = this.state;
        let { language } = this.props;
        return (
            <>
                <div className='manage-patient-container'>
                    <div className='m-p-title'>
                        Quản lý bệnh nhân khám bệnh
                    </div>

                    <div className='manage-patient-body row'>
                        <div className='col-4 form-group'>
                            <label>Chọn ngày khám</label>
                            <DatePicker
                                onChange={this.handleOnchangeDatePicker}
                                className='form-control'
                                value={this.state.currentDate}
                            />
                        </div>

                        <div className='col-12 table-manage-patient'>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <th>STT</th>
                                        <th>Thời gian</th>
                                        <th>Họ và tên</th>
                                        <th>Địa chỉ</th>
                                        <th>Giới tính</th>
                                        <th>Hành động</th>
                                    </tr>
                                    {dataPatient && dataPatient.length > 0 ?
                                        dataPatient.map((item, index) => {
                                            let time = language === LANGUAGES.VI ?
                                                item.timeTypeDataPatient.valueVi : item.timeTypeDataPatient.valueEn;
                                            let gender = language === LANGUAGES.VI ?
                                                item.patientData.genderData.valueVi : item.patientData.genderData.valueEn;
                                            return (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{time}</td>
                                                    <td>{item.patientData.firstName}</td>
                                                    <td>{item.patientData.address}</td>
                                                    <td>{gender}</td>
                                                    <td>
                                                        <button
                                                            className='mp-btn-confirm'
                                                            onClick={() => this.handleBtnConfirm(item)}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            className='mp-btn-cancel'
                                                            onClick={() => this.handleBtnCancel(item)}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                        :
                                        <tr>
                                            <td colSpan="6">No data</td>
                                        </tr>
                                    }

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <RemedyModal
                    isOpenModal={isOpenRemedyModal}
                    dataModal={dataModal}
                    closeRemedyModal={this.closeRemedyModal}
                    sendRemedy={this.sendRemedy}
                />

                <CancelBookingModal
                    isOpenModal={this.state.isOpenCancelModal}
                    dataModal={this.state.dataModal}
                    closeCancelModal={() => this.setState({ isOpenCancelModal: false })}
                    cancelBooking={this.cancelBooking}
                />
            </>
        )
    }
}

const mapStateToProps = state => ({
    language: state.app.language,
    user: state.user.userInfo,
});

const mapDispatchToProps = dispatch => {
    return {
    };
}

export default connect(mapStateToProps)(ManagePatient);
