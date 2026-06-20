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
            conclusion: '',
            followUpDate: '',
            clinicalServices: [],   // [{id, name}]
            medicines: [],          // [{id, name, dosage, note}]
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
                conclusion: '',
                followUpDate: '',
                clinicalServices: [],
                medicines: [],
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
            this.setState({
                conclusion: desc.conclusion || '',
                followUpDate: desc.followUpDate || '',
                clinicalServices: Array.isArray(desc.clinicalServices) ? desc.clinicalServices : [],
                medicines: Array.isArray(desc.medicines) ? desc.medicines : [],
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

        if (!this.state.conclusion || !this.state.conclusion.trim()) {
            toast.error(language === LANGUAGES.VI ? "Vui lòng nhập kết luận bệnh!" : "Please enter the conclusion!");
            return;
        }

        this.setState({ isSaving: true });

        let servicesStr = this.state.clinicalServices.map(s => s.name).join(', ');
        let prescriptionStr = this.state.medicines
            .map((m, i) => `${i + 1}. ${m.name}${m.quantity ? ' x' + m.quantity : ''}${m.dosage ? ' - ' + m.dosage : ''}${m.note ? ' (' + m.note + ')' : ''}`)
            .join('\n');

        let recordDescription = JSON.stringify({
            clinicalServices: this.state.clinicalServices,
            conclusion: this.state.conclusion.trim(),
            medicines: this.state.medicines,
            followUpDate: this.state.followUpDate ? this.state.followUpDate.trim() : ''
        });

        let resHistory = await savePatientHistory({
            patientId: dataModal.patientId,
            doctorId: dataModal.doctorId,
            description: recordDescription,
            files: this.state.imgBase64
        });

        if (resHistory && resHistory.errCode === 0) {
            let success = await this.props.sendRemedy({
                email: this.state.email,
                imgBase64: this.state.imgBase64,
                followUpDate: this.state.followUpDate ? this.state.followUpDate.trim() : '',
                diagnosis: this.state.conclusion.trim(),
                prescription: prescriptionStr,
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
            let services = Array.isArray(desc.clinicalServices)
                ? desc.clinicalServices.map(s => s.name).join(', ')
                : (desc.services || '');
            let meds = Array.isArray(desc.medicines) && desc.medicines.length > 0
                ? desc.medicines.map((m, i) => `${i + 1}. ${m.name}${m.dosage ? ' - ' + m.dosage : ''}`).join(' | ')
                : (desc.prescription || '');
            return (
                <div className="history-details">
                    {services && <p><strong>{language === LANGUAGES.VI ? 'Cận lâm sàng:' : 'Services:'}</strong> {services}</p>}
                    <p><strong>{language === LANGUAGES.VI ? 'Kết luận:' : 'Conclusion:'}</strong> {desc.conclusion || desc.diagnosis || (language === LANGUAGES.VI ? 'Không có' : 'None')}</p>
                    {meds && <p><strong>{language === LANGUAGES.VI ? 'Đơn thuốc:' : 'Medicines:'}</strong> {meds}</p>}
                    {desc.followUpDate && <p><strong>{language === LANGUAGES.VI ? 'Tái khám:' : 'Follow-up:'}</strong> <span className="text-danger">{desc.followUpDate}</span></p>}
                </div>
            );
        } catch (e) {
            return <p>{descriptionStr}</p>;
        }
    }

    handlePrint = () => {
        let { dataModal, language } = this.props;
        let idx = this.state.selectedHistoryIndex;
        let history = this.state.patientHistory;
        if (idx === null || !history[idx]) return;

        let item = history[idx];
        let visitNo = history.length - idx;
        let desc = {};
        try { desc = JSON.parse(item.description); } catch (e) {}

        let services = Array.isArray(desc.clinicalServices)
            ? desc.clinicalServices.map((s, i) => `<tr><td style="text-align:center">${i+1}</td><td>${s.name}</td></tr>`).join('')
            : (desc.services ? `<tr><td colspan="2">${desc.services}</td></tr>` : '');

        let medicines = Array.isArray(desc.medicines) && desc.medicines.length > 0
            ? desc.medicines.map((m, i) => `<tr>
                <td style="text-align:center">${i+1}</td>
                <td>${m.name || ''}</td>
                <td style="text-align:center">${m.quantity || ''}</td>
                <td>${m.dosage || ''}</td>
                <td>${m.note || ''}</td>
              </tr>`).join('')
            : (desc.prescription ? `<tr><td colspan="5">${desc.prescription}</td></tr>` : '');

        let vi = language === LANGUAGES.VI;
        let printHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>${vi ? 'Hồ Sơ Bệnh Án' : 'Medical Record'}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 20px; }
            h2 { text-align: center; color: #1a73e8; margin-bottom: 4px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
            .info-box { background: #f0f4ff; border: 1px solid #c5d5f8; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
            .info-box p { margin: 3px 0; }
            .section-label { font-weight: bold; color: #1a73e8; margin: 14px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { background: #e8f0fe; color: #1a73e8; padding: 6px 8px; text-align: left; border: 1px solid #ccc; font-size: 12px; }
            td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: middle; font-size: 12px; }
            .conclusion-box { background: #fff8e1; border-left: 4px solid #fbc02d; padding: 10px 14px; border-radius: 4px; }
            .followup { color: #d32f2f; font-weight: bold; }
            .footer-note { margin-top: 30px; text-align: right; font-style: italic; font-size: 11px; color: #888; }
            @media print { body { margin: 10px; } }
        </style></head><body>
        <h2>${vi ? 'Hồ Sơ Bệnh Án' : 'MEDICAL RECORD'}</h2>
        <div class="subtitle">${vi ? 'Lần khám' : 'Visit'} #${visitNo} &nbsp;|&nbsp; ${new Date(item.createdAt).toLocaleString('vi-VN')}</div>

        <div class="info-box">
            <p><strong>${vi ? 'Bệnh nhân:' : 'Patient:'}</strong> ${dataModal?.patientName || ''}</p>
            <p><strong>Email:</strong> ${this.state.email}</p>
            ${dataModal?.reason ? `<p><strong>${vi ? 'Lý do khám:' : 'Reason:'}</strong> ${dataModal.reason}</p>` : ''}
        </div>

        <div class="section-label">${vi ? 'Kết luận bệnh' : 'Conclusion'}</div>
        <div class="conclusion-box">${desc.conclusion || desc.diagnosis || (vi ? 'Không có' : 'None')}</div>

        ${services ? `
        <div class="section-label">${vi ? 'Chỉ định Lâm Sàng' : 'Clinical Services'}</div>
        <table>
            <thead><tr><th style="width:40px">STT</th><th>${vi ? 'Tên chỉ định' : 'Service Name'}</th></tr></thead>
            <tbody>${services}</tbody>
        </table>` : ''}

        ${medicines ? `
        <div class="section-label">${vi ? 'Kê đơn thuốc' : 'Prescription'}</div>
        <table>
            <thead><tr>
                <th style="width:40px">STT</th>
                <th>${vi ? 'Tên thuốc' : 'Medicine'}</th>
                <th style="width:70px">${vi ? 'Số lượng' : 'Qty'}</th>
                <th>${vi ? 'Liều dùng' : 'Dosage'}</th>
                <th>${vi ? 'Ghi chú' : 'Note'}</th>
            </tr></thead>
            <tbody>${medicines}</tbody>
        </table>` : ''}

        ${desc.followUpDate ? `<p class="followup">★ ${vi ? 'Hẹn tái khám:' : 'Follow-up:'} ${desc.followUpDate}</p>` : ''}

        <div class="footer-note">${vi ? 'In lúc:' : 'Printed at:'} ${new Date().toLocaleString('vi-VN')}</div>
        </body></html>`;

        let win = window.open('', '_blank', 'width=700,height=800');
        win.document.write(printHtml);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 400);
    }


    render() {
        let { isOpenModal, closeRemedyModal, dataModal } = this.props;
        let { language } = this.props;

        let isReadOnly = dataModal?.isReadOnly;
        let isDisabled = this.state.isSaving || isReadOnly;

        // Helpers for table rows
        const addService = () => {
            let name = prompt(language === LANGUAGES.VI ? 'Tên chỉ định lâm sàng:' : 'Clinical service name:');
            if (!name || !name.trim()) return;
            let list = [...this.state.clinicalServices, { id: Date.now(), name: name.trim() }];
            this.setState({ clinicalServices: list });
        };
        const removeService = (id) => this.setState({ clinicalServices: this.state.clinicalServices.filter(s => s.id !== id) });

        const addMedicine = () => {
            let list = [...this.state.medicines, { id: Date.now(), name: '', quantity: '', dosage: '', note: '' }];
            this.setState({ medicines: list });
        };
        const removeMedicine = (id) => this.setState({ medicines: this.state.medicines.filter(m => m.id !== id) });
        const updateMedicine = (id, field, val) => {
            this.setState({ medicines: this.state.medicines.map(m => m.id === id ? { ...m, [field]: val } : m) });
        };

        // Danh sách chỉ định lâm sàng có sẵn
        let allServiceOptions = language === LANGUAGES.VI ? [
            { value: 'SA', label: 'Siêu âm ổ bụng' },
            { value: 'XQ', label: 'Chụp X-Quang' },
            { value: 'CT', label: 'Chụp CT Scanner' },
            { value: 'MRI', label: 'Chụp MRI' },
            { value: 'XM', label: 'Xét nghiệm máu' },
            { value: 'NT', label: 'Xét nghiệm nước tiểu' },
            { value: 'NS', label: 'Nội soi dạ dày/đại tràng' },
            { value: 'ECG', label: 'Điện tâm đồ (ECG)' },
            { value: 'SP', label: 'Đo SpO2 / Khí máu' },
        ] : [
            { value: 'SA', label: 'Abdominal Ultrasound' },
            { value: 'XQ', label: 'X-Ray' },
            { value: 'CT', label: 'CT Scan' },
            { value: 'MRI', label: 'MRI Scan' },
            { value: 'XM', label: 'Blood Test' },
            { value: 'NT', label: 'Urinalysis' },
            { value: 'NS', label: 'Endoscopy / Colonoscopy' },
            { value: 'ECG', label: 'ECG / EKG' },
            { value: 'SP', label: 'SpO2 / Blood Gas' },
        ];
        // Chỉ hiện những chỉ định chưa được chọn
        let availableOptions = allServiceOptions.filter(
            opt => !this.state.clinicalServices.find(s => s.value === opt.value)
        );
        const addSelectedService = (e) => {
            let val = e.target.value;
            if (!val) return;
            let opt = allServiceOptions.find(o => o.value === val);
            if (!opt) return;
            this.setState({
                clinicalServices: [...this.state.clinicalServices, { id: Date.now(), value: opt.value, name: opt.label }]
            });
            e.target.value = '';
        };

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
                                    <div className="loading-text"><i className="fas fa-spinner fa-spin"></i> {language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</div>
                                ) : this.state.patientHistory && this.state.patientHistory.length > 0 ? (
                                    this.state.patientHistory.map((item, index) => {
                                        let visitNo = this.state.patientHistory.length - index;
                                        return (
                                            <div
                                                key={index}
                                                className={`history-item clickable ${this.state.selectedHistoryIndex === index ? 'active' : ''}`}
                                                onClick={() => this.handleSelectHistory(item, index)}
                                            >
                                                <div className="history-date">
                                                    <span className="visit-badge">#{visitNo}</span>
                                                    <i className="far fa-calendar-alt"></i> {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                                {this.renderHistoryDescription(item.description)}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="no-history">
                                        <i className="fas fa-folder-open"></i><br/>
                                        {language === LANGUAGES.VI ? 'Chưa có lịch sử khám bệnh.' : 'No medical history found.'}
                                    </div>
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

                            {/* === KẾT LUẬN BỆNH === */}
                            <div className='form-group mt-3'>
                                <label><i className="fas fa-stethoscope mr-1 text-primary"></i>{language === LANGUAGES.VI ? 'Kết luận bệnh' : 'Conclusion'}</label>
                                <textarea className='form-control' rows="2"
                                    value={this.state.conclusion}
                                    onChange={(e) => this.handleOnChangeInput(e, 'conclusion')}
                                    placeholder={language === LANGUAGES.VI ? "Nhập kết luận chẩn đoán..." : "Enter diagnosis conclusion..."}
                                    disabled={isDisabled}
                                ></textarea>
                            </div>

                            {/* === BẢNG CHỈ ĐỊNH LÂM SÀNG === */}
                            <div className='form-group mt-3'>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="mb-0"><i className="fas fa-vials mr-1 text-primary"></i>{language === LANGUAGES.VI ? 'Chỉ định Lâm Sàng' : 'Clinical Services'}</label>
                                </div>
                                {!isReadOnly && (
                                    <select
                                        className="form-control form-control-sm mb-2"
                                        onChange={addSelectedService}
                                        disabled={isDisabled || availableOptions.length === 0}
                                        defaultValue=""
                                        key={this.state.clinicalServices.length}
                                    >
                                        <option value="">{language === LANGUAGES.VI ? '-- Chọn chỉ định để thêm --' : '-- Select a service to add --'}</option>
                                        {availableOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                )}
                                <table className="table table-bordered table-sm mb-0 record-table">
                                    <thead className="thead-light">
                                        <tr>
                                            <th style={{ width: '40px' }}>STT</th>
                                            <th>{language === LANGUAGES.VI ? 'Tên chỉ định' : 'Service Name'}</th>
                                            {!isReadOnly && <th style={{ width: '50px' }}></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.clinicalServices.length === 0 ? (
                                            <tr><td colSpan={isReadOnly ? 2 : 3} className="text-center text-muted py-2">
                                                {language === LANGUAGES.VI ? 'Chưa có chỉ định' : 'No services added'}
                                            </td></tr>
                                        ) : this.state.clinicalServices.map((s, idx) => (
                                            <tr key={s.id}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td>{s.name}</td>
                                                {!isReadOnly && (
                                                    <td className="text-center">
                                                        <button type="button" className="btn btn-sm btn-outline-danger p-0 px-1" onClick={() => removeService(s.id)} disabled={isDisabled}>
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* === BẢNG KÊ ĐƠN THUỐC === */}
                            <div className='form-group mt-3'>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="mb-0">{language === LANGUAGES.VI ? 'Kê đơn thuốc' : 'Prescription'}</label>
                                    {!isReadOnly && (
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addMedicine} disabled={isDisabled}>
                                            <i className="fas fa-plus"></i> {language === LANGUAGES.VI ? 'Thêm thuốc' : 'Add medicine'}
                                        </button>
                                    )}
                                </div>
                                <table className="table table-bordered table-sm mb-0 record-table">
                                    <thead className="thead-light">
                                        <tr>
                                            <th style={{ width: '40px' }}>STT</th>
                                            <th>{language === LANGUAGES.VI ? 'Tên thuốc' : 'Medicine'}</th>
                                            <th style={{ width: '80px' }}>{language === LANGUAGES.VI ? 'Số lượng' : 'Qty'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Liều dùng' : 'Dosage'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Ghi chú' : 'Note'}</th>
                                            {!isReadOnly && <th style={{ width: '50px' }}></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.medicines.length === 0 ? (
                                            <tr><td colSpan={isReadOnly ? 5 : 6} className="text-center text-muted py-2">
                                                {language === LANGUAGES.VI ? 'Chưa kê đơn thuốc' : 'No medicines added'}
                                            </td></tr>
                                        ) : this.state.medicines.map((m, idx) => (
                                            <tr key={m.id}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td>
                                                    {isReadOnly ? m.name : (
                                                        <input className="form-control form-control-sm" value={m.name}
                                                            onChange={e => updateMedicine(m.id, 'name', e.target.value)}
                                                            placeholder={language === LANGUAGES.VI ? "Tên thuốc" : "Medicine name"}
                                                            disabled={isDisabled} />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? m.quantity : (
                                                        <input className="form-control form-control-sm" value={m.quantity}
                                                            onChange={e => updateMedicine(m.id, 'quantity', e.target.value)}
                                                            placeholder={language === LANGUAGES.VI ? "VD: 20 viên" : "e.g. 20 tabs"}
                                                            disabled={isDisabled} />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? m.dosage : (
                                                        <input className="form-control form-control-sm" value={m.dosage}
                                                            onChange={e => updateMedicine(m.id, 'dosage', e.target.value)}
                                                            placeholder={language === LANGUAGES.VI ? "VD: 1 viên/ngày" : "e.g. 1 tab/day"}
                                                            disabled={isDisabled} />
                                                    )}
                                                </td>
                                                <td>
                                                    {isReadOnly ? m.note : (
                                                        <input className="form-control form-control-sm" value={m.note}
                                                            onChange={e => updateMedicine(m.id, 'note', e.target.value)}
                                                            placeholder={language === LANGUAGES.VI ? "Ghi chú thêm" : "Extra notes"}
                                                            disabled={isDisabled} />
                                                    )}
                                                </td>
                                                {!isReadOnly && (
                                                    <td className="text-center">
                                                        <button type="button" className="btn btn-sm btn-outline-danger p-0 px-1" onClick={() => removeMedicine(m.id)} disabled={isDisabled}>
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                    {this.state.selectedHistoryIndex !== null && (
                        <Button
                            color="info"
                            className="px-4 text-white"
                            onClick={this.handlePrint}
                        >
                            <i className="fas fa-print"></i>{' '}
                            {language === LANGUAGES.VI ? 'In Bệnh Án' : 'Print Record'}
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
