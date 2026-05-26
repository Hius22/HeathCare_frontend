import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './MedicalRecordModal.scss';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { toast } from "react-toastify";
import moment from 'moment';
import { CommonUtils, LANGUAGES } from '../../../utils';
import Select from 'react-select';
import { getPatientHistory, savePatientHistory } from '../../../services/userService';

class MedicalRecordModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            imgBase64: '',
            diagnosis: '',
            prescription: '',
            followUpDate: '',
            selectedServices: [],
            patientHistory: [],
            isLoadingHistory: false
        }
    }

    async componentDidMount() {
        if (this.props.dataModal) {
            this.setState({
                email: this.props.dataModal.email
            }, () => {
                if (this.props.dataModal.patientId) {
                    this.fetchPatientHistory(this.props.dataModal.patientId);
                }
            })
        }
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.dataModal !== this.props.dataModal) {
            this.setState({
                email: this.props.dataModal.email,
                imgBase64: '',
                diagnosis: '',
                prescription: '',
                followUpDate: '',
                selectedServices: [],
                patientHistory: []
            }, () => {
                if (this.props.dataModal.patientId) {
                    this.fetchPatientHistory(this.props.dataModal.patientId);
                }
            })
        }
    }

    fetchPatientHistory = async (patientId) => {
        this.setState({ isLoadingHistory: true });
        try {
            let res = await getPatientHistory(patientId);
            if (res && res.errCode === 0) {
                this.setState({ patientHistory: res.data || [] });
            }
        } catch (e) {
            console.error(e);
        }
        this.setState({ isLoadingHistory: false });
    }

    handleOnchangeEmail = (event) => {
        this.setState({ email: event.target.value })
    }

    handleOnChangeInput = (event, id) => {
        let copyState = { ...this.state };
        copyState[id] = event.target.value;
        this.setState({ ...copyState });
    }

    handleChangeSelect = (selectedOption) => {
        this.setState({ selectedServices: selectedOption });
    }

    handleOnChangeImage = async (event) => {
        let data = event.target.files;
        let file = data[0];
        if (file) {
            let base64 = await CommonUtils.getBase64(file);
            this.setState({ imgBase64: base64 });
        }
    }

    handleSaveRecord = async () => {
        let { dataModal } = this.props;
        let servicesStr = this.state.selectedServices ? this.state.selectedServices.map(item => item.label).join(', ') : '';
        
        let recordDescription = JSON.stringify({
            diagnosis: this.state.diagnosis,
            services: servicesStr,
            prescription: this.state.prescription,
            followUpDate: this.state.followUpDate
        });

        // 1. Save History
        let resHistory = await savePatientHistory({
            patientId: dataModal.patientId,
            doctorId: dataModal.doctorId,
            description: recordDescription,
            files: this.state.imgBase64
        });

        if (resHistory && resHistory.errCode === 0) {
            // 2. Send email via sendRemedy 
            this.props.sendRemedy({
                email: this.state.email,
                imgBase64: this.state.imgBase64,
                followUpDate: this.state.followUpDate
            });
        } else {
            toast.error("Lỗi khi lưu bệnh án!");
        }
    }

    renderHistoryDescription = (descriptionStr) => {
        try {
            let desc = JSON.parse(descriptionStr);
            return (
                <div className="history-details">
                    <p><strong>Chẩn đoán:</strong> {desc.diagnosis || 'Không có'}</p>
                    <p><strong>Cận lâm sàng:</strong> {desc.services || 'Không có'}</p>
                    <p><strong>Đơn thuốc/Ghi chú:</strong> {desc.prescription || 'Không có'}</p>
                    {desc.followUpDate && <p><strong>Hẹn tái khám:</strong> <span className="text-danger">{desc.followUpDate}</span></p>}
                </div>
            );
        } catch (e) {
            return <p>{descriptionStr}</p>;
        }
    }

    render() {
        let { isOpenModal, closeRemedyModal, dataModal } = this.props;
        let { language } = this.props;

        // Options cho dịch vụ cận lâm sàng
        let serviceOptions = [
            { value: 'SA', label: 'Siêu âm ổ bụng' },
            { value: 'XQ', label: 'Chụp X-Quang' },
            { value: 'CT', label: 'Chụp CT Scanner' },
            { value: 'MRI', label: 'Chụp MRI' },
            { value: 'XM', label: 'Xét nghiệm máu' },
            { value: 'NT', label: 'Xét nghiệm nước tiểu' },
            { value: 'NS', label: 'Nội soi dạ dày/đại tràng' }
        ];

        return (
            <Modal
                isOpen={isOpenModal}
                className={'medical-record-modal-container'}
                size='xl'
                centered
            >
                <div className="modal-header">
                    <h5 className="modal-title">
                        <i className="fas fa-notes-medical"></i> Khám Bệnh & Lưu Hồ Sơ
                    </h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeRemedyModal}></button>
                </div>
                <ModalBody>
                    <div className='row content-body'>
                        {/* CỘT TRÁI: LỊCH SỬ BỆNH ÁN */}
                        <div className='col-5 history-section'>
                            <h6 className="section-title"><i className="fas fa-history"></i> Lịch Sử Khám Bệnh</h6>
                            <div className="history-list">
                                {this.state.isLoadingHistory ? (
                                    <div className="loading-text">Đang tải lịch sử...</div>
                                ) : this.state.patientHistory && this.state.patientHistory.length > 0 ? (
                                    this.state.patientHistory.map((item, index) => {
                                        return (
                                            <div key={index} className="history-item">
                                                <div className="history-date">
                                                    <i className="far fa-calendar-alt"></i> {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                                {this.renderHistoryDescription(item.description)}
                                                {item.files && (
                                                    <div className="history-file">
                                                        <a href={item.files} target="_blank" rel="noopener noreferrer">
                                                            <i className="fas fa-paperclip"></i> Xem đính kèm
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="no-history">Bệnh nhân chưa có lịch sử khám bệnh.</div>
                                )}
                            </div>
                        </div>

                        {/* CỘT PHẢI: FORM KHÁM BỆNH HIỆN TẠI */}
                        <div className='col-7 record-section'>
                            <h6 className="section-title"><i className="fas fa-stethoscope"></i> Bệnh Án Hiện Tại</h6>
                            
                            <div className="patient-info-banner">
                                <span><strong>Bệnh nhân:</strong> {dataModal?.patientName}</span>
                                <span><strong>Email:</strong> {this.state.email}</span>
                            </div>

                            <div className='form-group'>
                                <label>Chẩn đoán bệnh</label>
                                <textarea className='form-control' rows="2" 
                                    value={this.state.diagnosis}
                                    onChange={(e) => this.handleOnChangeInput(e, 'diagnosis')}
                                    placeholder="Nhập chẩn đoán lâm sàng..."
                                ></textarea>
                            </div>

                            <div className='form-group mt-3'>
                                <label>Chỉ định Cận Lâm Sàng</label>
                                <Select
                                    value={this.state.selectedServices}
                                    onChange={this.handleChangeSelect}
                                    options={serviceOptions}
                                    isMulti={true}
                                    placeholder="Chọn các dịch vụ cận lâm sàng..."
                                />
                            </div>

                            <div className='form-group mt-3'>
                                <label>Kê đơn thuốc & Ghi chú</label>
                                <textarea className='form-control' rows="3"
                                    value={this.state.prescription}
                                    onChange={(e) => this.handleOnChangeInput(e, 'prescription')}
                                    placeholder="Nhập chi tiết đơn thuốc và dặn dò..."
                                ></textarea>
                            </div>

                            <div className='form-group mt-3'>
                                <label>Hẹn tái khám (Tùy chọn)</label>
                                <input className='form-control' type='text'
                                    value={this.state.followUpDate}
                                    onChange={(e) => this.handleOnChangeInput(e, 'followUpDate')}
                                    placeholder="VD: Sau 1 tuần, 15/06/2023..."
                                />
                            </div>

                            <div className='form-group mt-3'>
                                <label>Tải lên File đính kèm (Ảnh siêu âm, toa thuốc bản cứng)</label>
                                <div className="file-upload-container">
                                    <input className='form-control-file' type='file'
                                        onChange={(event) => this.handleOnChangeImage(event)}
                                    />
                                    {this.state.imgBase64 && <span className="text-success ml-2"><i className="fas fa-check-circle"></i> Đã chọn file</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" className="btn-save px-4" onClick={() => this.handleSaveRecord()}>
                        <i className="fas fa-save"></i> Hoàn Tất & Gửi Email
                    </Button>{' '}
                    <Button color="secondary" className="px-4" onClick={closeRemedyModal}>
                        Huỷ
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

export default connect(mapStateToProps, mapDispatchToProps)(MedicalRecordModal);
