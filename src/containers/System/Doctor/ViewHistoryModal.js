import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, ModalBody, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';
import { getPatientHistory } from '../../../services/userService';
import { LANGUAGES } from '../../../utils';
import './ViewHistoryModal.scss';

class ViewHistoryModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patientHistory: [],
            isLoading: false,
            expandedIndex: null,  // mở rộng 1 record tại một thời điểm
        }
    }

    async componentDidMount() {
        if (this.props.patientId) await this.fetchHistory();
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.patientId !== this.props.patientId && this.props.patientId) {
            await this.fetchHistory();
        }
    }

    fetchHistory = async () => {
        this.setState({ isLoading: true, expandedIndex: null });
        try {
            let res = await getPatientHistory(this.props.patientId);
            if (res && res.errCode === 0) {
                this.setState({ patientHistory: res.data || [] });
                if (res.data && res.data.length > 0) this.setState({ expandedIndex: 0 });
            }
        } catch (e) {
            console.error('Error fetching patient history', e);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    /* Đọc desc và render chi tiết theo format mới */
    parseDesc = (descriptionStr) => {
        try { return JSON.parse(descriptionStr); } catch (e) { return null; }
    }

    renderDetailPanel = (item, index) => {
        let { language } = this.props;
        let vi = language === LANGUAGES.VI;
        let desc = this.parseDesc(item.description);

        if (!desc) return <p className="text-muted" style={{ fontSize: 13 }}>{item.description}</p>;

        // Services
        let services = Array.isArray(desc.clinicalServices) ? desc.clinicalServices : [];
        let legacyService = desc.services || '';

        // Medicines
        let medicines = Array.isArray(desc.medicines) ? desc.medicines : [];
        let legacyPrescription = desc.prescription || '';

        // Conclusion
        let conclusion = desc.conclusion || desc.diagnosis || '';

        return (
            <div className="detail-panel">
                {/* KẾT LUẬN */}
                <div className="detail-block">
                    <div className="block-label"><i className="fas fa-stethoscope"></i>{vi ? 'Kết luận bệnh' : 'Conclusion'}</div>
                    <div className="block-content conclusion-text">{conclusion || <span className="text-muted">—</span>}</div>
                </div>

                {/* CHỈNH ĐỊNH LÂM SÀNG */}
                {(services.length > 0 || legacyService) && (
                    <div className="detail-block">
                        <div className="block-label"><i className="fas fa-vials"></i>{vi ? 'Chỉ định Lâm Sàng' : 'Clinical Services'}</div>
                        {services.length > 0 ? (
                            <table className="detail-table">
                                <thead><tr><th style={{ width: 40 }}>STT</th><th>{vi ? 'Tên chỉ định' : 'Service'}</th></tr></thead>
                                <tbody>
                                    {services.map((s, i) => (
                                        <tr key={i}><td className="text-center">{i + 1}</td><td>{s.name}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="block-content">{legacyService}</div>
                        )}
                    </div>
                )}

                {/* ĐƠN THUỐC */}
                {(medicines.length > 0 || legacyPrescription) && (
                    <div className="detail-block">
                        <div className="block-label"><i className="fas fa-pills"></i>{vi ? 'Đơn thuốc' : 'Prescription'}</div>
                        {medicines.length > 0 ? (
                            <table className="detail-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 36 }}>STT</th>
                                        <th>{vi ? 'Tên thuốc' : 'Medicine'}</th>
                                        <th style={{ width: 70 }}>{vi ? 'SL' : 'Qty'}</th>
                                        <th>{vi ? 'Liều dùng' : 'Dosage'}</th>
                                        <th>{vi ? 'Ghi chú' : 'Note'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicines.map((m, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{i + 1}</td>
                                            <td>{m.name}</td>
                                            <td className="text-center">{m.quantity || '—'}</td>
                                            <td>{m.dosage || '—'}</td>
                                            <td>{m.note || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="block-content">{legacyPrescription}</div>
                        )}
                    </div>
                )}

                {/* TÁI KHÁM */}
                {desc.followUpDate && (
                    <div className="detail-block">
                        <div className="block-label follow-label"><i className="fas fa-calendar-check"></i>{vi ? 'Hẹn tái khám' : 'Follow-up'}</div>
                        <div className="block-content follow-date">{desc.followUpDate}</div>
                    </div>
                )}
            </div>
        );
    }

    handlePrint = (item, index) => {
        let { language, patientName } = this.props;
        let vi = language === LANGUAGES.VI;
        let desc = this.parseDesc(item.description) || {};
        let visitNo = this.state.patientHistory.length - index;

        let conclusion = desc.conclusion || desc.diagnosis || (vi ? 'Không có' : 'None');
        let services = Array.isArray(desc.clinicalServices) ? desc.clinicalServices : [];
        let medicines = Array.isArray(desc.medicines) ? desc.medicines : [];

        let serviceRows = services.map((s, i) =>
            `<tr><td style="text-align:center">${i + 1}</td><td>${s.name}</td></tr>`
        ).join('') || `<tr><td colspan="2" style="text-align:center;color:#999">${vi ? 'Không có' : 'None'}</td></tr>`;

        let medicineRows = medicines.map((m, i) =>
            `<tr><td style="text-align:center">${i + 1}</td><td>${m.name || ''}</td><td style="text-align:center">${m.quantity || ''}</td><td>${m.dosage || ''}</td><td>${m.note || ''}</td></tr>`
        ).join('') || `<tr><td colspan="5" style="text-align:center;color:#999">${vi ? 'Không có' : 'None'}</td></tr>`;

        let doctorName = '';
        if (item.doctorData) {
            doctorName = vi
                ? `${item.doctorData.lastName} ${item.doctorData.firstName}`
                : `${item.doctorData.firstName} ${item.doctorData.lastName}`;
        }

        let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>${vi ? 'Hồ Sơ Bệnh Án' : 'Medical Record'}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 30px; }
            .header { display:flex; justify-content:space-between; border-bottom:2px solid #1a73e8; padding-bottom:12px; margin-bottom:20px; }
            .clinic-name { color:#1a73e8; font-size:18px; font-weight:bold; margin:0 0 4px; }
            .clinic-sub { font-size:11px; color:#666; margin:0; }
            h2 { text-align:center; font-size:17px; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px; color:#333; }
            .info-box { background:#f0f4ff; border:1px solid #c5d5f8; border-radius:6px; padding:10px 14px; margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; }
            .info-box p { margin:3px 0; font-size:13px; }
            .section-label { font-weight:bold; color:#1a73e8; margin:14px 0 6px; border-bottom:1px solid #ddd; padding-bottom:4px; font-size:13px; }
            table { width:100%; border-collapse:collapse; margin-bottom:10px; }
            th { background:#e8f0fe; color:#1a73e8; padding:6px 8px; border:1px solid #ccc; font-size:12px; text-align:left; }
            td { padding:5px 8px; border:1px solid #ddd; font-size:12px; }
            .conclusion-box { background:#fff8e1; border-left:4px solid #fbc02d; padding:10px 14px; border-radius:4px; font-size:13px; }
            .followup { color:#d32f2f; font-weight:bold; margin-top:8px; }
            .sigs { display:flex; justify-content:space-between; margin-top:40px; text-align:center; }
            .sig { width:30%; font-size:13px; }
            .sig-line { height:60px; border-bottom:1px solid #999; margin-bottom:6px; }
            .footer { text-align:center; font-size:11px; color:#888; margin-top:30px; border-top:1px dashed #ddd; padding-top:10px; }
            @media print { body{margin:10px;} }
        </style></head><body>
        <div class="header">
            <div>
                <p class="clinic-name">HỆ THỐNG Y TẾ CARE DIRECT</p>
                <p class="clinic-sub">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. HCM | Hotline: 1900 8181</p>
            </div>
            <div style="text-align:right;font-size:11px;color:#777">
                <p>Mã HS: HS-${item.id}</p>
                <p>${vi ? 'Lần khám' : 'Visit'} #${visitNo}</p>
                <p>${vi ? 'Ngày in:' : 'Printed:'} ${new Date().toLocaleString('vi-VN')}</p>
            </div>
        </div>

        <h2>${vi ? 'Hồ Sơ Bệnh Án' : 'Medical Record'}</h2>

        <div class="info-box">
            <p><strong>${vi ? 'Bệnh nhân:' : 'Patient:'}</strong> ${patientName}</p>
            <p><strong>${vi ? 'Ngày khám:' : 'Exam Date:'}</strong> ${moment(item.createdAt).format('DD/MM/YYYY HH:mm')}</p>
            ${doctorName ? `<p><strong>${vi ? 'Bác sĩ:' : 'Doctor:'}</strong> ${doctorName}</p>` : ''}
        </div>

        <div class="section-label">${vi ? 'Kết luận bệnh' : 'Conclusion'}</div>
        <div class="conclusion-box">${conclusion}</div>

        <div class="section-label">${vi ? 'Chỉ định Lâm Sàng' : 'Clinical Services'}</div>
        <table>
            <thead><tr><th style="width:40px">STT</th><th>${vi ? 'Tên chỉ định' : 'Service Name'}</th></tr></thead>
            <tbody>${serviceRows}</tbody>
        </table>

        <div class="section-label">${vi ? 'Đơn thuốc' : 'Prescription'}</div>
        <table>
            <thead><tr>
                <th style="width:36px">STT</th>
                <th>${vi ? 'Tên thuốc' : 'Medicine'}</th>
                <th style="width:60px">${vi ? 'SL' : 'Qty'}</th>
                <th>${vi ? 'Liều dùng' : 'Dosage'}</th>
                <th>${vi ? 'Ghi chú' : 'Note'}</th>
            </tr></thead>
            <tbody>${medicineRows}</tbody>
        </table>

        ${desc.followUpDate ? `<p class="followup">★ ${vi ? 'Hẹn tái khám:' : 'Follow-up:'} ${desc.followUpDate}</p>` : ''}

        <div class="sigs">
            <div class="sig"><div class="sig-line"></div><strong>${vi ? 'Bệnh nhân' : 'Patient'}</strong><br/><small>(${vi ? 'Ký và ghi rõ họ tên' : 'Signature'})</small></div>
            <div class="sig"><div class="sig-line"></div><strong>${vi ? 'Thu ngân / Lễ tân' : 'Cashier'}</strong><br/><small>(${vi ? 'Ký và đóng dấu' : 'Signature & Stamp'})</small></div>
            <div class="sig"><div class="sig-line"></div><strong>${vi ? 'Bác sĩ điều trị' : 'Doctor'}</strong><br/><small>${doctorName}</small></div>
        </div>
        <div class="footer">${vi ? 'Cảm ơn quý bệnh nhân đã tin tưởng và sử dụng dịch vụ!' : 'Thank you for choosing our services!'}</div>
        </body></html>`;

        let win = window.open('', '_blank', 'width=800,height=700');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    }

    render() {
        let { isOpen, closeModal, patientName, language } = this.props;
        let { patientHistory, isLoading, expandedIndex } = this.state;
        let vi = language === LANGUAGES.VI;

        return (
            <Modal isOpen={isOpen} toggle={closeModal} size="xl" centered className="view-history-modal-container">
                {/* HEADER */}
                <div className="modal-header vhm-header">
                    <div className="vhm-title">
                        <i className="fas fa-file-medical-alt"></i>
                        <div>
                            <div className="vhm-title-main">{vi ? 'Hồ Sơ Bệnh Án' : 'Medical Records'}</div>
                            <div className="vhm-title-sub">{patientName}</div>
                        </div>
                    </div>
                    <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                </div>

                <ModalBody className="vhm-body">
                    {isLoading ? (
                        <div className="vhm-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>{vi ? 'Đang tải hồ sơ bệnh án...' : 'Loading medical records...'}</p>
                        </div>
                    ) : patientHistory.length > 0 ? (
                        <div className="vhm-content">
                            {/* DANH SÁCH LẦN KHÁM - CỘT TRÁI */}
                            <div className="vhm-timeline">
                                <div className="timeline-header">{vi ? `${patientHistory.length} lần khám` : `${patientHistory.length} visit(s)`}</div>
                                {patientHistory.map((item, index) => {
                                    let visitNo = patientHistory.length - index;
                                    let isActive = expandedIndex === index;
                                    let desc = this.parseDesc(item.description) || {};
                                    let conclusion = desc.conclusion || desc.diagnosis || '';
                                    return (
                                        <div
                                            key={index}
                                            className={`timeline-item ${isActive ? 'active' : ''}`}
                                            onClick={() => this.setState({ expandedIndex: index })}
                                        >
                                            <div className="tl-badge">#{visitNo}</div>
                                            <div className="tl-info">
                                                <div className="tl-date">
                                                    <i className="far fa-calendar-alt"></i>{' '}
                                                    {moment(item.createdAt).format('DD/MM/YYYY')}
                                                    <span className="tl-time">{moment(item.createdAt).format('HH:mm')}</span>
                                                </div>
                                                {conclusion && (
                                                    <div className="tl-preview">{conclusion.length > 50 ? conclusion.slice(0, 50) + '…' : conclusion}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* CHI TIẾT LẦN KHÁM - CỘT PHẢI */}
                            <div className="vhm-detail">
                                {expandedIndex !== null && patientHistory[expandedIndex] && (() => {
                                    let item = patientHistory[expandedIndex];
                                    let visitNo = patientHistory.length - expandedIndex;
                                    return (
                                        <>
                                            <div className="detail-top-bar">
                                                <div className="detail-visit-label">
                                                    <span className="detail-badge">#{visitNo}</span>
                                                    <span className="detail-date">{moment(item.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                                                </div>
                                                <button
                                                    className="btn-print-record"
                                                    onClick={() => this.handlePrint(item, expandedIndex)}
                                                >
                                                    <i className="fas fa-print"></i>{' '}{vi ? 'In bệnh án' : 'Print'}
                                                </button>
                                            </div>
                                            {this.renderDetailPanel(item, expandedIndex)}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="vhm-empty">
                            <i className="far fa-folder-open"></i>
                            <p>{vi ? 'Bệnh nhân chưa có lịch sử bệnh án nào.' : 'No medical record history available.'}</p>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="vhm-footer">
                    <Button color="secondary" onClick={closeModal} className="px-4">
                        {vi ? 'Đóng' : 'Close'}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }
}

const mapStateToProps = state => ({ language: state.app.language });
export default connect(mapStateToProps)(ViewHistoryModal);
