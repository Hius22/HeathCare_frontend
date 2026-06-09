import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';
import { getPatientHistory } from '../../../services/userService';
import { LANGUAGES } from '../../../utils';
import './ViewHistoryModal.scss';

class ViewHistoryModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patientHistory: [],
            isLoading: false
        }
    }

    async componentDidMount() {
        if (this.props.patientId) {
            await this.fetchHistory();
        }
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.patientId !== this.props.patientId && this.props.patientId) {
            await this.fetchHistory();
        }
    }

    fetchHistory = async () => {
        this.setState({ isLoading: true });
        try {
            let res = await getPatientHistory(this.props.patientId);
            if (res && res.errCode === 0) {
                this.setState({
                    patientHistory: res.data || []
                });
            }
        } catch (e) {
            console.error("Error fetching patient history", e);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    renderHistoryDescription = (descriptionStr, item) => {
        let { language } = this.props;
        try {
            let desc = JSON.parse(descriptionStr);
            return (
                <div className="history-details">
                    <p>
                        <strong>{language === LANGUAGES.VI ? 'Chẩn đoán:' : 'Diagnosis:'}</strong> {desc.diagnosis || '—'}
                    </p>
                    <p>
                        <strong>{language === LANGUAGES.VI ? 'Cận lâm sàng chỉ định:' : 'Clinical Services:'}</strong> {desc.services || '—'}
                    </p>
                    <p>
                        <strong>{language === LANGUAGES.VI ? 'Đơn thuốc/Ghi chú:' : 'Prescription/Notes:'}</strong> {desc.prescription || '—'}
                    </p>
                    
                    {desc.price ? (
                        <p>
                            <strong>{language === LANGUAGES.VI ? 'Giá khám:' : 'Doctor Fee:'}</strong> <span>
                                {language === LANGUAGES.VI 
                                    ? (isNaN(desc.price.split(' / ')[0]) ? desc.price.split(' / ')[0] : Number(desc.price.split(' / ')[0]).toLocaleString('vi-VN') + ' VNĐ')
                                    : desc.price.split(' / ')[1]
                                }
                            </span>
                        </p>
                    ) : (
                        item?.doctorData?.Doctor_Infor?.priceTypeData && (
                            <p>
                                <strong>{language === LANGUAGES.VI ? 'Giá khám:' : 'Doctor Fee:'}</strong> <span>
                                    {language === LANGUAGES.VI 
                                        ? (isNaN(item.doctorData.Doctor_Infor.priceTypeData.valueVi) 
                                            ? `${item.doctorData.Doctor_Infor.priceTypeData.valueVi} VNĐ`
                                            : `${Number(item.doctorData.Doctor_Infor.priceTypeData.valueVi).toLocaleString('vi-VN')} VNĐ`)
                                        : `${item.doctorData.Doctor_Infor.priceTypeData.valueEn} USD`
                                    }
                                </span>
                            </p>
                        )
                    )}

                    {desc.paymentMethod ? (
                        <p>
                            <strong>{language === LANGUAGES.VI ? 'Hình thức thanh toán:' : 'Payment Method:'}</strong> {desc.paymentMethod}
                        </p>
                    ) : (
                        item?.doctorData?.Doctor_Infor?.paymentTypeData && (
                            <p>
                                <strong>{language === LANGUAGES.VI ? 'Hình thức thanh toán:' : 'Payment Method:'}</strong> {
                                    language === LANGUAGES.VI 
                                        ? item.doctorData.Doctor_Infor.paymentTypeData.valueVi 
                                        : item.doctorData.Doctor_Infor.paymentTypeData.valueEn
                                }
                            </p>
                        )
                    )}

                    {desc.followUpDate && (
                        <p className="follow-up-date">
                            <strong>{language === LANGUAGES.VI ? 'Hẹn tái khám:' : 'Follow-up Date:'}</strong> <span>{desc.followUpDate}</span>
                        </p>
                    )}
                </div>
            );
        } catch (e) {
            return <p>{descriptionStr}</p>;
        }
    }

    handlePrint = (item, patientName) => {
        let { language } = this.props;
        let desc = {};
        try {
            desc = JSON.parse(item.description);
        } catch (e) {
            console.error(e);
        }

        // Format dates
        let dateStr = moment(item.createdAt).format('DD/MM/YYYY HH:mm');
        let printDateStr = moment().format('DD/MM/YYYY HH:mm');

        // Extract values
        let diagnosis = desc.diagnosis || '—';
        let services = desc.services || '—';
        let prescription = desc.prescription || '—';
        let followUpDate = desc.followUpDate || '';

        // Payment method fallback
        let paymentMethod = desc.paymentMethod || '';
        if (!paymentMethod && item.doctorData?.Doctor_Infor?.paymentTypeData) {
            paymentMethod = language === LANGUAGES.VI 
                ? item.doctorData.Doctor_Infor.paymentTypeData.valueVi 
                : item.doctorData.Doctor_Infor.paymentTypeData.valueEn;
        }
        if (!paymentMethod) {
            paymentMethod = language === LANGUAGES.VI ? 'Tiền mặt' : 'Cash';
        }

        // Pricing fallback
        let priceStr = language === LANGUAGES.VI ? '200.000 VNĐ' : '10 USD';
        if (desc.price) {
            priceStr = language === LANGUAGES.VI 
                ? (isNaN(desc.price.split(' / ')[0]) ? desc.price.split(' / ')[0] : Number(desc.price.split(' / ')[0]).toLocaleString('vi-VN') + ' VNĐ')
                : desc.price.split(' / ')[1];
        } else if (item.doctorData?.Doctor_Infor?.priceTypeData) {
            priceStr = language === LANGUAGES.VI 
                ? (isNaN(item.doctorData.Doctor_Infor.priceTypeData.valueVi) 
                    ? `${item.doctorData.Doctor_Infor.priceTypeData.valueVi} VNĐ`
                    : `${Number(item.doctorData.Doctor_Infor.priceTypeData.valueVi).toLocaleString('vi-VN')} VNĐ`)
                : `${item.doctorData.Doctor_Infor.priceTypeData.valueEn} USD`;
        }

        // Doctor Name
        let doctorNameStr = '';
        if (item.doctorData) {
            doctorNameStr = language === LANGUAGES.VI
                ? `${item.doctorData.lastName} ${item.doctorData.firstName}`
                : `${item.doctorData.firstName} ${item.doctorData.lastName}`;
        }

        let printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${language === LANGUAGES.VI ? 'Hóa đơn & Đơn thuốc' : 'Receipt & Prescription'}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 30px;
                            color: #333;
                            line-height: 1.5;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 2px solid #333;
                            padding-bottom: 15px;
                            margin-bottom: 25px;
                        }
                        .clinic-info h3 {
                            margin: 0 0 5px 0;
                            color: #1a73e8;
                            font-size: 20px;
                        }
                        .clinic-info p {
                            margin: 0;
                            font-size: 13px;
                            color: #666;
                        }
                        .doc-title {
                            text-align: center;
                            font-size: 22px;
                            font-weight: bold;
                            text-transform: uppercase;
                            margin-bottom: 25px;
                            letter-spacing: 1px;
                        }
                        .section {
                            margin-bottom: 20px;
                        }
                        .section-title {
                            font-weight: bold;
                            text-transform: uppercase;
                            font-size: 14px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                            color: #1a73e8;
                        }
                        .grid-2 {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                        }
                        .info-item {
                            margin-bottom: 8px;
                            font-size: 14px;
                        }
                        .info-item strong {
                            color: #555;
                        }
                        .prescription-box {
                            background-color: #f9f9f9;
                            border: 1px dashed #ccc;
                            padding: 15px;
                            font-family: Courier, monospace;
                            white-space: pre-wrap;
                            font-size: 14px;
                            margin-top: 10px;
                        }
                        .signatures {
                            margin-top: 50px;
                            display: flex;
                            justify-content: space-between;
                            text-align: center;
                        }
                        .sig-block {
                            width: 30%;
                            font-size: 14px;
                        }
                        .sig-space {
                            height: 80px;
                        }
                        @media print {
                            body { padding: 0; }
                            .print-btn-container { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-btn-container" style="text-align: right; margin-bottom: 10px;">
                        <button onclick="window.print()" style="padding: 8px 15px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            ${language === LANGUAGES.VI ? 'In hóa đơn' : 'Print Document'}
                        </button>
                    </div>
                    <div class="header">
                        <div class="clinic-info">
                            <h3>HỆ THỐNG Y TẾ CARE DIRECT</h3>
                            <p>Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
                            <p>Hotline: 1900 8181 - Website: caredirect.vn</p>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #777;">
                            <p>Mã HS: HS-${item.id}</p>
                            <p>Ngày in: ${printDateStr}</p>
                        </div>
                    </div>
                    
                    <div class="doc-title">${language === LANGUAGES.VI ? 'Hóa đơn & Đơn thuốc' : 'Receipt & Prescription'}</div>

                    <div class="section">
                        <div class="section-title">${language === LANGUAGES.VI ? 'Thông tin bệnh nhân' : 'Patient Information'}</div>
                        <div class="grid-2">
                            <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Họ và tên:' : 'Full Name:'}</strong> ${patientName}</div>
                            <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Ngày khám:' : 'Date of Exam:'}</strong> ${dateStr}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">${language === LANGUAGES.VI ? 'Kết quả chẩn đoán & Chỉ định cận lâm sàng' : 'Diagnosis & Clinical Services'}</div>
                        <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Chẩn đoán bệnh:' : 'Diagnosis:'}</strong> ${diagnosis}</div>
                        <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Cận lâm sàng chỉ định:' : 'Clinical Services:'}</strong> ${services}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">${language === LANGUAGES.VI ? 'Đơn thuốc & Dặn dò của bác sĩ' : "Prescription & Doctor's Notes"}</div>
                        <div class="prescription-box">${prescription}</div>
                        ${followUpDate ? `
                            <p style="margin-top: 10px; color: #d32f2f; font-weight: bold; font-size: 14px;">
                                * ${language === LANGUAGES.VI ? 'Hẹn tái khám vào ngày:' : 'Follow-up appointment:'} ${followUpDate}
                            </p>
                        ` : ''}
                    </div>

                    <div class="section" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                        <div class="section-title">${language === LANGUAGES.VI ? 'Thông tin thanh toán dịch vụ' : 'Payment Details'}</div>
                        <div class="grid-2">
                            <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Phí dịch vụ khám:' : 'Booking Fee:'}</strong> ${priceStr}</div>
                            <div class="info-item"><strong>${language === LANGUAGES.VI ? 'Hình thức thanh toán:' : 'Payment Method:'}</strong> ${paymentMethod}</div>
                            <div class="info-item" style="grid-column: span 2;">
                                <strong>${language === LANGUAGES.VI ? 'Trạng thái giao dịch:' : 'Transaction Status:'}</strong> 
                                <span style="color: #2e7d32; font-weight: bold;">${language === LANGUAGES.VI ? 'Đã xác nhận thanh toán thành công' : 'Payment Confirmed Successfully'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="signatures">
                        <div class="sig-block">
                            <strong>${language === LANGUAGES.VI ? 'Bệnh nhân' : 'Patient'}</strong>
                            <p style="font-size: 12px; color: #888;">(Ký và ghi rõ họ tên)</p>
                            <div class="sig-space"></div>
                        </div>
                        <div class="sig-block">
                            <strong>${language === LANGUAGES.VI ? 'Thu ngân / Lễ tân' : 'Cashier / Receptionist'}</strong>
                            <p style="font-size: 12px; color: #888;">(Ký và đóng dấu)</p>
                            <div class="sig-space"></div>
                        </div>
                        <div class="sig-block">
                            <strong>${language === LANGUAGES.VI ? 'Bác sĩ điều trị' : 'Medical Doctor'}</strong>
                            <p style="font-size: 12px; color: #888;">(Ký và đóng dấu)</p>
                            <div class="sig-space"></div>
                            ${doctorNameStr ? `<p style="font-weight: bold; font-size: 14px; margin-top: 10px;">${doctorNameStr}</p>` : ''}
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    render() {
        let { isOpen, closeModal, patientName, language } = this.props;
        let { patientHistory, isLoading } = this.state;

        return (
            <Modal
                isOpen={isOpen}
                toggle={closeModal}
                size="lg"
                centered
                className="view-history-modal-container"
            >
                <ModalHeader toggle={closeModal}>
                    <div className="modal-title">
                        <i className="fas fa-file-medical-alt"></i>
                        <span>
                            {language === LANGUAGES.VI ? `Lịch sử bệnh án - Bệnh nhân: ${patientName}` : `Medical Records - Patient: ${patientName}`}
                        </span>
                    </div>
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="loading-section">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>{language === LANGUAGES.VI ? 'Đang tải hồ sơ bệnh án...' : 'Loading medical records...'}</p>
                        </div>
                    ) : patientHistory && patientHistory.length > 0 ? (
                        <div className="history-list-wrapper">
                            {patientHistory.map((item, index) => {
                                return (
                                    <div key={index} className="history-item" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px', backgroundColor: '#fff' }}>
                                        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '10px', marginBottom: '12px' }}>
                                            <span className="history-date" style={{ fontWeight: '600', color: '#4a5568' }}>
                                                <i className="far fa-calendar-check" style={{ marginRight: '6px', color: '#3182ce' }}></i>
                                                {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </span>
                                            
                                            <div className="history-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                {item.files && (
                                                    <div className="history-file">
                                                        <a href={item.files} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#4a5568', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <i className="fas fa-paperclip"></i>
                                                            {language === LANGUAGES.VI ? 'Xem file đính kèm' : 'View attachment'}
                                                        </a>
                                                    </div>
                                                )}
                                                <button 
                                                    className="btn btn-print-invoice"
                                                    onClick={() => this.handlePrint(item, patientName)}
                                                    style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                >
                                                    <i className="fas fa-print"></i>
                                                    {language === LANGUAGES.VI ? 'In hóa đơn & Đơn thuốc' : 'Print Receipt & Rx'}
                                                </button>
                                            </div>
                                        </div>
                                        {this.renderHistoryDescription(item.description, item)}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="empty-history">
                            <i className="far fa-folder-open"></i>
                            <p>
                                {language === LANGUAGES.VI ? 'Bệnh nhân chưa có lịch sử bệnh án nào.' : 'No medical record history available for this patient.'}
                            </p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={closeModal} className="px-4">
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

export default connect(mapStateToProps)(ViewHistoryModal);
