import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { LANGUAGES } from '../../../utils';
import moment from 'moment';

class PatientInfoModal extends Component {

    render() {
        let { isOpenModal, closePatientInfoModal, dataModal, language } = this.props;
        
        let gender = '';
        if (dataModal && dataModal.genderData) {
            gender = language === LANGUAGES.VI ? dataModal.genderData.valueVi : dataModal.genderData.valueEn;
        }

        return (
            <Modal
                isOpen={isOpenModal}
                size='md'
                centered
            >
                <div className="modal-header bg-info text-white">
                    <h5 className="modal-title">
                        <i className="fas fa-id-card"></i> Thông tin chi tiết bệnh nhân
                    </h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closePatientInfoModal}></button>
                </div>
                <ModalBody>
                    {dataModal && (
                        <div className="patient-info-detail">
                            <div className="row mb-3">
                                <div className="col-12 text-center mb-3">
                                    <div className="avatar-circle" style={{
                                        width: '80px', height: '80px', borderRadius: '50%', 
                                        backgroundColor: '#e0e0e0', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', 
                                        margin: '0 auto', fontSize: '30px', color: '#666'
                                    }}>
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <h4 className="mt-2 text-primary">{dataModal.firstName} {dataModal.lastName}</h4>
                                </div>
                            </div>
                            
                            <table className="table table-bordered table-striped">
                                <tbody>
                                    <tr>
                                        <td width="35%"><strong>Email:</strong></td>
                                        <td>{dataModal.email || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Số điện thoại:</strong></td>
                                        <td>{dataModal.phonenumber || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Giới tính:</strong></td>
                                        <td>{gender || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Địa chỉ:</strong></td>
                                        <td>{dataModal.address || '—'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={closePatientInfoModal}>
                        Đóng
                    </Button>
                </ModalFooter>
            </Modal >
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
