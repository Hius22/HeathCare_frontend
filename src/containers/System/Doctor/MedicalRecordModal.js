import React, { Component } from 'react';
import { connect } from "react-redux";
import './MedicalRecordModal.scss';
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { toast } from "react-toastify";
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import CommonUtils from '../../../utils/CommonUtils';
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
            isLoadingHistory: false,
            isSaving: false,
            selectedHistoryIndex: null
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
                patientHistory: [],
                isSaving: false,
                selectedHistoryIndex: null
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
                let history = res.data || [];
                this.setState({ patientHistory: history }, () => {
                    // Auto select the latest history record if opened in read-only mode
                    if (this.props.dataModal && this.props.dataModal.isReadOnly && history.length > 0) {
                        this.handleSelectHistory(history[0], 0);
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
        this.setState({ isLoadingHistory: false });
    }

    handleSelectHistory = (item, index) => {
        try {
            let desc = JSON.parse(item.description);
            let selectedServices = [];
            if (desc.services) {
                let serviceLabels = desc.services.split(', ');
                let options = this.props.language === LANGUAGES.VI ? [
                    { value: 'SA', label: 'Siêu âm ổ bụng' },
                    { value: 'XQ', label: 'Chụp X-Quang' },
                    { value: 'CT', label: 'Chụp CT Scanner' },
                    { value: 'MRI', label: 'Chụp MRI' },
                    { value: 'XM', label: 'Xét nghiệm máu' },
                    { value: 'NT', label: 'Xét nghiệm nước tiểu' },
                    { value: 'NS', label: 'Nội soi dạ dày/đại tràng' }
                ] : [
                    { value: 'SA', label: 'Abdominal Ultrasound' },
                    { value: 'XQ', label: 'X-Ray' },
                    { value: 'CT', label: 'CT Scan' },
                    { value: 'MRI', label: 'MRI Scan' },
                    { value: 'XM', label: 'Blood Test' },
                    { value: 'NT', label: 'Urinalysis' },
                    { value: 'NS', label: 'Endoscopy / Colonoscopy' }
                ];
                selectedServices = options.filter(opt => serviceLabels.includes(opt.label));
            }

            this.setState({
                diagnosis: desc.diagnosis || '',
                prescription: desc.prescription || '',
                followUpDate: desc.followUpDate || '',
                selectedServices: selectedServices,
                imgBase64: item.files || '',
                selectedHistoryIndex: index
            });
        } catch (e) {
            console.error("Error parsing history details:", e);
        }
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
        let { language } = this.props;
        let data = event.target.files;
        let file = data[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error(language === LANGUAGES.VI ? "Chỉ chấp nhận file ảnh (PNG, JPG, JPEG)!" : "Only image files (PNG, JPG, JPEG) are allowed!");
                event.target.value = null;
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error(language === LANGUAGES.VI ? "Dung lượng ảnh tối đa là 2MB!" : "Max image size is 2MB!");
                event.target.value = null;
                return;
            }
            let base64 = await CommonUtils.compressImage(file);
            this.setState({ imgBase64: base64 });
        }
    }

    handleSaveRecord = async () => {
        let { dataModal, language } = this.props;

        if (!this.state.diagnosis || !this.state.diagnosis.trim()) {
            toast.error(language === LANGUAGES.VI ? "Vui lòng nhập chẩn đoán bệnh!" : "Please enter the diagnosis!");
            return;
        }

        if (!this.state.prescription || !this.state.prescription.trim()) {
            toast.error(language === LANGUAGES.VI ? "Vui lòng nhập đơn thuốc & dặn dò!" : "Please enter the prescription & notes!");
            return;
        }

        this.setState({ isSaving: true });

        let servicesStr = this.state.selectedServices ? this.state.selectedServices.map(item => item.label).join(', ') : '';
        
        let recordDescription = JSON.stringify({
            diagnosis: this.state.diagnosis.trim(),
            services: servicesStr,
            prescription: this.state.prescription.trim(),
            followUpDate: this.state.followUpDate ? this.state.followUpDate.trim() : ''
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
            let success = await this.props.sendRemedy({
                email: this.state.email,
                imgBase64: this.state.imgBase64,
                followUpDate: this.state.followUpDate ? this.state.followUpDate.trim() : '',
                diagnosis: this.state.diagnosis.trim(),
                prescription: this.state.prescription.trim(),
                services: servicesStr
            });
            if (!success) {
                this.setState({ isSaving: false });
            }
        } else {
            toast.error(language === LANGUAGES.VI ? "Lỗi khi lưu bệnh án!" : "Error saving medical record!");
            this.setState({ isSaving: false });
        }
    }

    renderHistoryDescription = (descriptionStr) => {
        let { language } = this.props;
        try {
            let desc = JSON.parse(descriptionStr);
            return (
                <div className="history-details">
                    <p><strong>{language === LANGUAGES.VI ? 'Chẩn đoán:' : 'Diagnosis:'}</strong> {desc.diagnosis || (language === LANGUAGES.VI ? 'Không có' : 'None')}</p>
                    <p><strong>{language === LANGUAGES.VI ? 'Cận lâm sàng:' : 'Services:'}</strong> {desc.services || (language === LANGUAGES.VI ? 'Không có' : 'None')}</p>
                    {desc.paymentMethod && <p><strong>{language === LANGUAGES.VI ? 'Thanh toán:' : 'Payment:'}</strong> {desc.paymentMethod}</p>}
                    <p><strong>{language === LANGUAGES.VI ? 'Đơn thuốc/Ghi chú:' : 'Prescription/Notes:'}</strong> {desc.prescription || (language === LANGUAGES.VI ? 'Không có' : 'None')}</p>
                    {desc.followUpDate && <p><strong>{language === LANGUAGES.VI ? 'Hẹn tái khám:' : 'Follow-up:'}</strong> <span className="text-danger">{desc.followUpDate}</span></p>}
                </div>
            );
        } catch (e) {
            return <p>{descriptionStr}</p>;
        }
    }

    render() {
        let { isOpenModal, closeRemedyModal, dataModal } = this.props;
        let { language } = this.props;

        // Options cho dịch vụ cận lâm sàng (bilingual)
        let serviceOptions = language === LANGUAGES.VI ? [
            { value: 'SA', label: 'Siêu âm ổ bụng' },
            { value: 'XQ', label: 'Chụp X-Quang' },
            { value: 'CT', label: 'Chụp CT Scanner' },
            { value: 'MRI', label: 'Chụp MRI' },
            { value: 'XM', label: 'Xét nghiệm máu' },
            { value: 'NT', label: 'Xét nghiệm nước tiểu' },
            { value: 'NS', label: 'Nội soi dạ dày/đại tràng' }
        ] : [
            { value: 'SA', label: 'Abdominal Ultrasound' },
            { value: 'XQ', label: 'X-Ray' },
            { value: 'CT', label: 'CT Scan' },
            { value: 'MRI', label: 'MRI Scan' },
            { value: 'XM', label: 'Blood Test' },
            { value: 'NT', label: 'Urinalysis' },
            { value: 'NS', label: 'Endoscopy / Colonoscopy' }
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
                        <i className={dataModal?.isReadOnly ? "fas fa-folder-open" : "fas fa-notes-medical"}></i>{' '}
                        {dataModal?.isReadOnly 
                            ? (language === LANGUAGES.VI ? 'Chi Tiết Hồ Sơ Bệnh Án' : 'Medical Record Details')
                            : (language === LANGUAGES.VI ? 'Khám Bệnh & Lưu Hồ Sơ' : 'Medical Examination & Records')
                        }
                    </h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeRemedyModal} disabled={this.state.isSaving}></button>
                </div>
                <ModalBody>
                    <div className='row content-body'>
                        {/* CỘT TRÁI: LỊCH SỬ BỆNH ÁN */}
                        <div className='col-md-5 history-section'>
                            <h6 className="section-title">
                                <i className="fas fa-history"></i> {language === LANGUAGES.VI ? 'Lịch Sử Khám Bệnh' : 'Medical History'}
                            </h6>
                            <div className="history-list">
                                {this.state.isLoadingHistory ? (
                                    <div className="loading-text">{language === LANGUAGES.VI ? 'Đang tải lịch sử...' : 'Loading history...'}</div>
                                ) : this.state.patientHistory && this.state.patientHistory.length > 0 ? (
                                    this.state.patientHistory.map((item, index) => {
                                        return (
                                            <div 
                                                key={index} 
                                                className={`history-item ${dataModal?.isReadOnly ? 'clickable' : ''} ${this.state.selectedHistoryIndex === index ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (dataModal?.isReadOnly) {
                                                        this.handleSelectHistory(item, index);
                                                    }
                                                }}
                                            >
                                                <div className="history-date">
                                                    <i className="far fa-calendar-alt"></i> {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                                {this.renderHistoryDescription(item.description)}
                                                {item.files && (
                                                    <div className="history-file">
                                                        <a href={item.files} target="_blank" rel="noopener noreferrer">
                                                            <i className="fas fa-paperclip"></i> {language === LANGUAGES.VI ? 'Xem đính kèm' : 'View attachment'}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="no-history">{language === LANGUAGES.VI ? 'Bệnh nhân chưa có lịch sử khám bệnh.' : 'No medical history found for this patient.'}</div>
                                )}
                            </div>
                        </div>

                        {/* CỘT PHẢI: FORM KHÁM BỆNH HOẶC CHI TIẾT BỆNH ÁN */}
                        <div className='col-md-7 record-section'>
                            <h6 className="section-title">
                                <i className={dataModal?.isReadOnly ? "fas fa-file-medical-alt" : "fas fa-stethoscope"}></i>{' '}
                                {dataModal?.isReadOnly 
                                    ? (language === LANGUAGES.VI ? 'Chi Tiết Bệnh Án Đã Chọn' : 'Selected Medical Record')
                                    : (language === LANGUAGES.VI ? 'Bệnh Án Hiện Tại' : 'Current Medical Record')
                                }
                            </h6>
                            
                            <div className="patient-info-banner d-flex flex-column gap-1">
                                <div><strong>{language === LANGUAGES.VI ? 'Bệnh nhân:' : 'Patient:'}</strong> {dataModal?.patientName}</div>
                                {dataModal?.reason && <div><strong>{language === LANGUAGES.VI ? 'Lý do khám:' : 'Reason:'}</strong> {dataModal.reason}</div>}
                                <div><strong>Email:</strong> {this.state.email}</div>
                            </div>

                            <div className='form-group mt-3'>
                                <label>{language === LANGUAGES.VI ? 'Chẩn đoán bệnh' : 'Diagnosis'}</label>
                                <textarea className='form-control' rows="2" 
                                    value={this.state.diagnosis}
                                    onChange={(e) => this.handleOnChangeInput(e, 'diagnosis')}
                                    placeholder={language === LANGUAGES.VI ? "Nhập chẩn đoán lâm sàng..." : "Enter clinical diagnosis..."}
                                    disabled={this.state.isSaving || dataModal?.isReadOnly}
                                ></textarea>
                            </div>

                            <div className='form-group mt-3'>
                                <label>{language === LANGUAGES.VI ? 'Chỉ định Cận Lâm Sàng' : 'Clinical Services / Lab Work'}</label>
                                <Select
                                    value={this.state.selectedServices}
                                    onChange={this.handleChangeSelect}
                                    options={serviceOptions}
                                    isMulti={true}
                                    placeholder={language === LANGUAGES.VI ? "Chọn các dịch vụ cận lâm sàng..." : "Select clinical services..."}
                                    isDisabled={this.state.isSaving || dataModal?.isReadOnly}
                                />
                            </div>

                            <div className='form-group mt-3'>
                                <label>{language === LANGUAGES.VI ? 'Kê đơn thuốc & Ghi chú' : "Prescription & Doctor's Notes"}</label>
                                <textarea className='form-control' rows="3"
                                    value={this.state.prescription}
                                    onChange={(e) => this.handleOnChangeInput(e, 'prescription')}
                                    placeholder={language === LANGUAGES.VI ? "Nhập chi tiết đơn thuốc và dặn dò..." : "Enter detailed prescription and doctor's instructions..."}
                                    disabled={this.state.isSaving || dataModal?.isReadOnly}
                                ></textarea>
                            </div>

                            <div className='form-group mt-3'>
                                <label>{language === LANGUAGES.VI ? 'Hẹn tái khám (Tùy chọn)' : 'Follow-up Appointment (Optional)'}</label>
                                <input className='form-control' type='text'
                                    value={this.state.followUpDate}
                                    onChange={(e) => this.handleOnChangeInput(e, 'followUpDate')}
                                    placeholder={language === LANGUAGES.VI ? "VD: Sau 1 tuần, 15/06/2023..." : "e.g. In 1 week, 15/06/2023..."}
                                    disabled={this.state.isSaving || dataModal?.isReadOnly}
                                />
                            </div>

                            <div className='form-group mt-3'>
                                <label>{language === LANGUAGES.VI ? 'File đính kèm (Ảnh siêu âm, toa thuốc bản cứng)' : 'Attachment File (Ultrasound, physical prescription)'}</label>
                                <div className="file-upload-container">
                                    {dataModal?.isReadOnly ? (
                                        this.state.imgBase64 ? (
                                            <a href={this.state.imgBase64} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary px-3">
                                                <i className="fas fa-eye"></i> {language === LANGUAGES.VI ? 'Xem file đính kèm' : 'View attachment'}
                                            </a>
                                        ) : (
                                            <span className="text-muted font-italic">{language === LANGUAGES.VI ? 'Không có file đính kèm' : 'No attachment file'}</span>
                                        )
                                    ) : (
                                        <>
                                            <input className='form-control-file' type='file'
                                                onChange={(event) => this.handleOnChangeImage(event)}
                                                disabled={this.state.isSaving}
                                            />
                                            {this.state.imgBase64 && <span className="text-success ml-2"><i className="fas fa-check-circle"></i> {language === LANGUAGES.VI ? 'Đã chọn file' : 'File selected'}</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    {!dataModal?.isReadOnly && (
                        <Button 
                            color="primary" 
                            className="btn-save px-4" 
                            onClick={() => this.handleSaveRecord()}
                            disabled={this.state.isSaving}
                        >
                            {this.state.isSaving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> {language === LANGUAGES.VI ? 'Đang xử lý...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> {language === LANGUAGES.VI ? 'Hoàn Tất & Gửi Email' : 'Complete & Send Email'}
                                </>
                            )}
                        </Button>
                    )}{' '}
                    <Button 
                        color="secondary" 
                        className="px-4" 
                        onClick={closeRemedyModal}
                        disabled={this.state.isSaving}
                    >
                        {dataModal?.isReadOnly 
                            ? (language === LANGUAGES.VI ? 'Đóng' : 'Close')
                            : (language === LANGUAGES.VI ? 'Huỷ' : 'Cancel')
                        }
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
