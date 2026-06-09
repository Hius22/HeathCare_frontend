import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { LANGUAGES } from '../../../utils';
import moment from 'moment';

class PatientInfoModal extends Component {

    render() {
        let { isOpenModal, closePatientInfoModal, dataModal: booking, language } = this.props;
        let patient = booking ? booking.patientData : null;
        
        let gender = '';
        if (patient && patient.genderData) {
            gender = language === LANGUAGES.VI ? patient.genderData.valueVi : patient.genderData.valueEn;
        }

        let birthdayStr = '—';
        if (patient && patient.birthday) {
            let dob = isNaN(patient.birthday) ? patient.birthday : +patient.birthday;
            birthdayStr = moment(dob).format('DD/MM/YYYY');
        }

        let appointmentDateStr = '—';
        if (booking && booking.date) {
            let ad = isNaN(booking.date) ? booking.date : +booking.date;
            appointmentDateStr = moment(ad).format('DD/MM/YYYY');
        }

        let appointmentTimeStr = '—';
        if (booking && booking.timeTypeDataPatient) {
            appointmentTimeStr = language === LANGUAGES.VI 
                ? booking.timeTypeDataPatient.valueVi 
                : booking.timeTypeDataPatient.valueEn;
        }

        return (
            <Modal
                isOpen={isOpenModal}
                size='lg'
                centered
            >
                <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" style={{ fontSize: '18px', fontWeight: '600' }}>
                        <i className="fas fa-id-card"></i> {language === LANGUAGES.VI ? 'Thông tin chi tiết bệnh án & Bệnh nhân' : 'Patient & Booking Details'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closePatientInfoModal}></button>
                </div>
                <ModalBody>
                    {booking && patient && (
                        <div className="patient-info-detail">
                            <div className="row mb-3">
                                <div className="col-12 text-center mb-3">
                                    <div className="avatar-circle" style={{
                                        width: '80px', height: '80px', borderRadius: '50%', 
                                        backgroundColor: '#e3f2fd', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', 
                                        margin: '0 auto', fontSize: '30px', color: '#1a73e8',
                                        border: '2px solid #bbdefb'
                                    }}>
                                        <i className="fas fa-user-injured"></i>
                                    </div>
                                    <h4 className="mt-2 text-primary" style={{ fontWeight: '600' }}>
                                        {patient.lastName} {patient.firstName}
                                    </h4>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="text-secondary border-bottom pb-2 mb-3" style={{ fontSize: '15px', fontWeight: '600' }}>
                                        <i className="fas fa-user"></i> {language === LANGUAGES.VI ? 'Thông tin hành chính' : 'Demographics'}
                                    </h5>
                                    <table className="table table-bordered table-hover">
                                        <tbody>
                                            <tr>
                                                <td width="40%"><strong>Email:</strong></td>
                                                <td>{patient.email || '—'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Số điện thoại' : 'Phone'}</strong></td>
                                                <td>{patient.phonenumber || '—'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Ngày sinh' : 'Date of Birth'}</strong></td>
                                                <td>{birthdayStr}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Giới tính' : 'Gender'}</strong></td>
                                                <td>{gender || '—'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Địa chỉ' : 'Address'}</strong></td>
                                                <td>{patient.address || '—'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-md-6">
                                    <h5 className="text-secondary border-bottom pb-2 mb-3" style={{ fontSize: '15px', fontWeight: '600' }}>
                                        <i className="fas fa-calendar-check"></i> {language === LANGUAGES.VI ? 'Thông tin lịch khám' : 'Appointment Info'}
                                    </h5>
                                    <table className="table table-bordered table-hover">
                                        <tbody>
                                            <tr>
                                                <td width="40%"><strong>{language === LANGUAGES.VI ? 'Ngày hẹn khám' : 'Appointment Date'}</strong></td>
                                                <td className="text-primary font-weight-bold"><strong>{appointmentDateStr}</strong></td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Ca khám' : 'Time Slot'}</strong></td>
                                                <td>{appointmentTimeStr}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</strong></td>
                                                <td>
                                                    {booking.statusId === 'S1' && <span className="badge bg-warning text-dark">{language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending'}</span>}
                                                    {booking.statusId === 'S2' && <span className="badge bg-primary">{language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed'}</span>}
                                                    {booking.statusId === 'S3' && <span className="badge bg-success">{language === LANGUAGES.VI ? 'Đã khám xong' : 'Completed'}</span>}
                                                    {booking.statusId === 'S4' && <span className="badge bg-danger">{language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled'}</span>}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>{language === LANGUAGES.VI ? 'Mã lịch hẹn' : 'Booking Code'}</strong></td>
                                                <td className="text-monospace" style={{ fontSize: '14px', fontWeight: 'bold', color: '#d32f2f' }}>
                                                    {booking && booking.token ? booking.token.substring(0, 8).toUpperCase() : '—'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-12 mt-2">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <h6 className="card-title text-secondary">
                                                <i className="fas fa-file-medical-alt"></i> <strong>{language === LANGUAGES.VI ? 'Lý do khám / Triệu chứng bệnh lý' : 'Reason for Visit / Symptoms'}</strong>
                                            </h6>
                                            <p className="card-text text-dark mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                {booking.reason || (language === LANGUAGES.VI ? 'Không có thông tin mô tả triệu chứng.' : 'No symptom description provided.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={closePatientInfoModal}>
                        {language === LANGUAGES.VI ? 'Đóng' : 'Close'}
                    </Button>
                </ModalFooter>
            </Modal>
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(PatientInfoModal);
