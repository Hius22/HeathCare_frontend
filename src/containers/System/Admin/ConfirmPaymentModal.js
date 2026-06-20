import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, Button } from 'reactstrap';
import { LANGUAGES } from '../../../utils';
import { getPatientHistory } from '../../../services/userService';
import { toast } from 'react-toastify';
import './ConfirmPaymentModal.scss';

const PAYMENT_OPTIONS = [
    { value: 'PAY1', icon: 'fa-money-bill-wave', colorVI: '#28a745', labelVI: 'Tiền mặt', labelEN: 'Cash' },
    { value: 'PAY2', icon: 'fa-credit-card', colorVI: '#1a73e8', labelVI: 'Thẻ ATM', labelEN: 'ATM Card' },
];

class ConfirmPaymentModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            examFee: 0,               // giá khám của bác sĩ (VND)
            servicePrices: {},        // { serviceId: price }
            medicinePrices: {},       // { medicineId: price }
            clinicalServices: [],     // từ bệnh án gần nhất
            medicines: [],            // từ bệnh án gần nhất
            paymentMethod: '',
            isConfirmed: false,
            isLoadingRecord: false,
            isPaid: false,            // sau khi thanh toán xong
            paidData: null,           // lưu để in hóa đơn
        };
    }

    async componentDidMount() {
        this.initializeData();
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.bookingData !== this.props.bookingData) {
            this.initializeData();
        }
    }

    initializeData = async () => {
        let { bookingData } = this.props;
        if (!bookingData) return;

        // 1. Lấy giá khám của bác sĩ
        let examFee = 0;
        let info = bookingData.doctorData?.Doctor_Infor;
        if (info?.priceTypeData?.valueVi) {
            let raw = info.priceTypeData.valueVi;
            examFee = isNaN(raw) ? 0 : Number(raw);
        }

        // 2. Lấy bệnh án gần nhất để lấy danh sách chỉ định lâm sàng và đơn thuốc
        let isPreviouslyPaid = bookingData.isPaid === 1;
        this.setState({ 
            isLoadingRecord: true, 
            isPaid: isPreviouslyPaid, 
            paidData: isPreviouslyPaid ? { total: bookingData.price || examFee, methodLabel: this.props.language === LANGUAGES.VI ? 'Đã thanh toán' : 'Paid' } : null, 
            isConfirmed: isPreviouslyPaid, 
            paymentMethod: isPreviouslyPaid ? 'PAY1' : '', 
            servicePrices: {}, 
            medicinePrices: {},
            clinicalServices: [], 
            medicines: [],
            examFee 
        });

        try {
            let res = await getPatientHistory(bookingData.patientId);
            if (res && res.errCode === 0 && res.data && res.data.length > 0) {
                let lastRecord = res.data[0]; // mới nhất
                let desc = {};
                try { desc = JSON.parse(lastRecord.description); } catch (e) {}
                let services = Array.isArray(desc.clinicalServices) ? desc.clinicalServices : [];
                let medicines = Array.isArray(desc.medicines) ? desc.medicines.map((m, idx) => ({ ...m, id: m.id || idx })) : [];
                
                let servicePrices = {};
                let medicinePrices = {};
                if (isPreviouslyPaid) {
                    if (desc.servicePrices) servicePrices = desc.servicePrices;
                    if (desc.medicinePrices) medicinePrices = desc.medicinePrices;
                }

                this.setState({ 
                    clinicalServices: services,
                    medicines: medicines,
                    servicePrices: servicePrices,
                    medicinePrices: medicinePrices
                });
            }
        } catch (e) {
            console.error('Error loading patient history:', e);
        }
        this.setState({ isLoadingRecord: false });
    }

    getTotal = () => {
        let { examFee, servicePrices, medicinePrices } = this.state;
        let serviceTotal = Object.values(servicePrices).reduce((sum, v) => sum + (Number(v) || 0), 0);
        let medicineTotal = Object.values(medicinePrices).reduce((sum, v) => sum + (Number(v) || 0), 0);
        return examFee + serviceTotal + medicineTotal;
    }

    formatVND = (num) => Number(num || 0).toLocaleString('vi-VN') + ' đ';

    handleServicePriceChange = (serviceId, val) => {
        this.setState(prev => ({
            servicePrices: { ...prev.servicePrices, [serviceId]: val }
        }));
    }

    handleMedicinePriceChange = (medicineId, val) => {
        this.setState(prev => ({
            medicinePrices: { ...prev.medicinePrices, [medicineId]: val }
        }));
    }

    handleConfirm = () => {
        let { language, handleConfirmPayment, bookingData } = this.props;
        let { paymentMethod, isConfirmed, servicePrices, medicinePrices } = this.state;
        let vi = language === LANGUAGES.VI;

        if (!isConfirmed) {
            toast.warning(vi ? 'Vui lòng xác nhận bệnh nhân đã thanh toán!' : 'Please confirm the patient has paid!');
            return;
        }
        if (!paymentMethod) {
            toast.warning(vi ? 'Vui lòng chọn hình thức thanh toán!' : 'Please select a payment method!');
            return;
        }

        let total = this.getTotal();
        let opt = PAYMENT_OPTIONS.find(o => o.value === paymentMethod);
        let methodLabel = opt ? (vi ? opt.labelVI : opt.labelEN) : paymentMethod;

        // Lưu lại để in hóa đơn
        this.setState({ isPaid: true, paidData: { total, methodLabel } });
        handleConfirmPayment(bookingData.id, String(total), methodLabel, servicePrices, medicinePrices);
    }

    handlePrintInvoice = () => {
        let { bookingData, language } = this.props;
        let { examFee, clinicalServices, servicePrices, medicines, medicinePrices, paidData } = this.state;
        let vi = language === LANGUAGES.VI;

        let patientName = bookingData?.patientData
            ? `${bookingData.patientData.firstName || ''} ${bookingData.patientData.lastName || ''}`
            : '';
        let doctorName = bookingData?.doctorData
            ? (vi
                ? `${bookingData.doctorData.lastName} ${bookingData.doctorData.firstName}`
                : `${bookingData.doctorData.firstName} ${bookingData.doctorData.lastName}`)
            : '';

        let serviceRows = clinicalServices.map((s, i) => {
            let price = Number(servicePrices[s.id] || 0);
            return `<tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${s.name}</td>
                <td style="text-align:right">${this.formatVND(price)}</td>
            </tr>`;
        }).join('');

        let medicineRows = medicines.map((m, i) => {
            let price = Number(medicinePrices[m.id] || 0);
            return `<tr>
                <td style="text-align:center">${i + 1 + clinicalServices.length}</td>
                <td>💊 ${m.name} (${m.quantity || ''})</td>
                <td style="text-align:right">${this.formatVND(price)}</td>
            </tr>`;
        }).join('');

        let total = paidData?.total || this.getTotal();

        let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>${vi ? 'Hóa đơn thanh toán' : 'Payment Invoice'}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 30px; }
            h2 { text-align:center; color: #1a73e8; margin-bottom: 2px; }
            .clinic { text-align:center; font-size:12px; color:#666; margin-bottom:20px; }
            .info-box { border: 1px solid #ddd; border-radius:6px; padding:10px 14px; margin-bottom:16px; }
            .info-box p { margin:3px 0; }
            table { width:100%; border-collapse:collapse; margin-bottom:12px; }
            th { background:#e8f0fe; color:#1a73e8; padding:7px 8px; text-align:left; border:1px solid #ccc; }
            td { padding:6px 8px; border:1px solid #ddd; }
            .total-row td { font-weight:bold; background:#f0fff4; color:#1b5e20; font-size:14px; }
            .total-row td:last-child { text-align:right; }
            .method { margin:10px 0; font-weight:bold; color:#1a73e8; }
            .footer { text-align:center; margin-top:30px; font-size:11px; color:#888; }
            @media print { body { margin:10px; } }
        </style></head><body>
        <h2>${vi ? 'HÓA ĐƠN THANH TOÁN' : 'PAYMENT INVOICE'}</h2>
        <div class="clinic">${new Date().toLocaleString('vi-VN')}</div>

        <div class="info-box">
            <p><strong>${vi ? 'Bệnh nhân:' : 'Patient:'}</strong> ${patientName}</p>
            <p><strong>${vi ? 'Bác sĩ:' : 'Doctor:'}</strong> ${doctorName}</p>
            <p><strong>Email:</strong> ${bookingData?.patientData?.email || ''}</p>
        </div>

        <table>
            <thead><tr>
                <th style="width:40px">STT</th>
                <th>${vi ? 'Dịch vụ / Mục thu' : 'Service / Item'}</th>
                <th style="width:130px;text-align:right">${vi ? 'Số tiền' : 'Amount'}</th>
            </tr></thead>
            <tbody>
                <tr>
                    <td style="text-align:center">—</td>
                    <td>${vi ? 'Phí khám bệnh (bác sĩ)' : 'Consultation fee (doctor)'}</td>
                    <td style="text-align:right">${this.formatVND(examFee)}</td>
                </tr>
                ${serviceRows}
                ${medicineRows}
                <tr class="total-row">
                    <td colspan="2">TỔNG CỘNG</td>
                    <td>${this.formatVND(total)}</td>
                </tr>
            </tbody>
        </table>

        <p class="method">💳 ${vi ? 'Hình thức thanh toán:' : 'Payment method:'} ${paidData?.methodLabel || ''}</p>
        <div class="footer">${vi ? 'Cảm ơn quý bệnh nhân đã tin tưởng và sử dụng dịch vụ!' : 'Thank you for choosing our services!'}<br/>
        ${vi ? 'In lúc:' : 'Printed at:'} ${new Date().toLocaleString('vi-VN')}</div>
        </body></html>`;

        let win = window.open('', '_blank', 'width=700,height=700');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    }

    render() {
        let { isOpenModal, closeConfirmModal, bookingData, language } = this.props;
        let { examFee, clinicalServices, servicePrices, medicines, medicinePrices, paymentMethod, isConfirmed, isLoadingRecord, isPaid } = this.state;
        let vi = language === LANGUAGES.VI;

        let patientName = bookingData?.patientData
            ? `${bookingData.patientData.firstName || ''} ${bookingData.patientData.lastName || ''}`
            : '';
        let doctorName = bookingData?.doctorData
            ? (vi
                ? `${bookingData.doctorData.lastName} ${bookingData.doctorData.firstName}`
                : `${bookingData.doctorData.firstName} ${bookingData.doctorData.lastName}`)
            : '';

        let total = this.getTotal();

        return (
            <Modal isOpen={isOpenModal} toggle={closeConfirmModal} className="confirm-payment-modal" size="lg" centered>
                <div className="modal-header header-payment text-white">
                    <h5 className="modal-title">
                        <i className="fa-solid fa-file-invoice-dollar"></i>{' '}
                        {vi ? 'Thanh Toán & Hoàn Tất Thủ Tục' : 'Checkout & Confirm Payment'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeConfirmModal}></button>
                </div>

                <div className="modal-body payment-body">
                    {/* Thông tin bệnh nhân */}
                    <div className="patient-summary-box mb-3">
                        <div className="row-item">
                            <span className="label-text"><i className="fas fa-user mr-1"></i>{vi ? 'Bệnh nhân:' : 'Patient:'}</span>
                            <span className="value-text highlight">{patientName}</span>
                        </div>
                        <div className="row-item">
                            <span className="label-text"><i className="fas fa-user-md mr-1"></i>{vi ? 'Bác sĩ phụ trách:' : 'Doctor:'}</span>
                            <span className="value-text">{doctorName}</span>
                        </div>
                    </div>

                    {/* BẢNG CHI PHÍ DỊCH VỤ */}
                    <div className="services-fee-section mb-3">
                        <div className="section-label-pay">
                            <i className="fas fa-receipt mr-1"></i>
                            {vi ? 'Chi tiết dịch vụ & chi phí' : 'Services & Fee Details'}
                        </div>

                        {isLoadingRecord ? (
                            <div className="text-center py-3 text-muted">
                                <i className="fas fa-spinner fa-spin mr-2"></i>{vi ? 'Đang tải bệnh án...' : 'Loading record...'}
                            </div>
                        ) : (
                            <table className="table table-bordered table-sm fee-table mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>STT</th>
                                        <th>{vi ? 'Dịch vụ / Mục thu' : 'Service / Item'}</th>
                                        <th style={{ width: '160px' }}>{vi ? 'Số tiền (VNĐ)' : 'Amount (VND)'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Hàng phí khám - cố định */}
                                    <tr className="exam-fee-row">
                                        <td className="text-center">—</td>
                                        <td>
                                            <i className="fas fa-stethoscope mr-1 text-primary"></i>
                                            {vi ? 'Phí khám bệnh (bác sĩ)' : 'Consultation fee (doctor)'}
                                        </td>
                                        <td className="text-right font-weight-bold text-success">
                                            {this.formatVND(examFee)}
                                        </td>
                                    </tr>
                                    {/* Hàng các chỉ định lâm sàng */}
                                    {clinicalServices.length > 0 && clinicalServices.map((s, idx) => (
                                        <tr key={s.id}>
                                            <td className="text-center">{idx + 1}</td>
                                            <td>
                                                <i className="fas fa-vials mr-1 text-info"></i>
                                                {s.name}
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm price-input"
                                                    value={servicePrices[s.id] || ''}
                                                    onChange={e => this.handleServicePriceChange(s.id, e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    disabled={isPaid}
                                                />
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Hàng phí thuốc kê đơn */}
                                    {medicines.length > 0 && (
                                        <tr className="table-secondary font-weight-bold" style={{ fontSize: '12px' }}>
                                            <td colSpan={3} className="pl-2">
                                                <i className="fas fa-pills mr-1 text-warning"></i>
                                                {vi ? 'Đơn thuốc của bác sĩ' : 'Doctor\'s Prescription'}
                                            </td>
                                        </tr>
                                    )}
                                    {medicines.map((m, idx) => (
                                        <tr key={m.id}>
                                            <td className="text-center">{idx + 1 + clinicalServices.length}</td>
                                            <td>
                                                <span className="text-dark font-weight-bold">{m.name}</span>
                                                {m.quantity && <span className="text-muted small ml-1">({m.quantity})</span>}
                                                {m.dosage && <div className="text-muted small" style={{ fontSize: '11px' }}>{m.dosage}</div>}
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm price-input"
                                                    value={medicinePrices[m.id] || ''}
                                                    onChange={e => this.handleMedicinePriceChange(m.id, e.target.value)}
                                                    placeholder="0"
                                                    min="0"
                                                    disabled={isPaid}
                                                />
                                            </td>
                                        </tr>
                                    ))}

                                    {clinicalServices.length === 0 && medicines.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center text-muted py-2" style={{ fontStyle: 'italic', fontSize: '12px' }}>
                                                {vi ? 'Không có chỉ định cận lâm sàng & đơn thuốc trong lần khám này' : 'No clinical services or prescription in this visit'}
                                            </td>
                                        </tr>
                                    )}

                                    {/* Tổng cộng */}
                                    <tr className="total-fee-row">
                                        <td colSpan={2} className="text-right font-weight-bold">
                                            <i className="fas fa-coins mr-1"></i>
                                            {vi ? 'TỔNG CỘNG' : 'TOTAL'}
                                        </td>
                                        <td className="total-amount">{this.formatVND(total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* PHƯƠNG THỨC THANH TOÁN */}
                    <div className="payment-method-section mb-3">
                        <div className="section-label-pay">
                            <i className="fas fa-credit-card mr-1"></i>
                            {vi ? 'Phương thức thanh toán' : 'Payment Method'}
                        </div>
                        <div className="payment-options-grid">
                            {PAYMENT_OPTIONS.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`payment-option-card ${paymentMethod === opt.value ? 'selected' : ''} ${isPaid ? 'disabled' : ''}`}
                                    onClick={() => !isPaid && this.setState({ paymentMethod: opt.value })}
                                    style={{ borderColor: paymentMethod === opt.value ? opt.colorVI : '', cursor: isPaid ? 'not-allowed' : 'pointer' }}
                                >
                                    <i className={`fas ${opt.icon}`} style={{ color: opt.colorVI }}></i>
                                    <span>{vi ? opt.labelVI : opt.labelEN}</span>
                                    {paymentMethod === opt.value && <i className="fas fa-check-circle check-icon" style={{ color: opt.colorVI }}></i>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Checkbox xác nhận */}
                    <div className="form-check check-confirm mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="confirmSign"
                            checked={isConfirmed}
                            onChange={e => !isPaid && this.setState({ isConfirmed: e.target.checked })}
                            disabled={isPaid}
                        />
                        <label className="form-check-label select-label-check" htmlFor="confirmSign">
                            {vi
                                ? 'Bệnh nhân đã thanh toán và hoàn tất thủ tục khám bệnh'
                                : 'Patient has paid and completed the checkup procedure'}
                        </label>
                    </div>
                </div>

                <div className="modal-footer">
                    {isPaid ? (
                        <Button color="info" className="px-4 text-white font-weight-bold" onClick={this.handlePrintInvoice}>
                            <i className="fas fa-print"></i>{' '}{vi ? 'In Hóa Đơn' : 'Print Invoice'}
                        </Button>
                    ) : (
                        <Button color="success" className="px-4 text-white font-weight-bold" onClick={this.handleConfirm}>
                            <i className="fa-solid fa-circle-check"></i>{' '}{vi ? 'Hoàn tất thanh toán' : 'Complete Checkout'}
                        </Button>
                    )}
                    <Button color="secondary" className="px-3" onClick={closeConfirmModal}>
                        {vi ? 'Đóng' : 'Close'}
                    </Button>
                </div>
            </Modal>
        );
    }
}

const mapStateToProps = state => ({ language: state.app.language });
const mapDispatchToProps = dispatch => ({});
export default connect(mapStateToProps, mapDispatchToProps)(ConfirmPaymentModal);
