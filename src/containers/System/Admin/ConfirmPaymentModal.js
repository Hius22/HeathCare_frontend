import React, { Component } from 'react';
import { connect } from "react-redux";
import { Modal, Button } from 'reactstrap';
import { LANGUAGES } from '../../../utils';
import { getALLCodeService } from '../../../services/userService';
import { toast } from 'react-toastify';
import './ConfirmPaymentModal.scss';

class ConfirmPaymentModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            priceVi: '',
            priceEn: '',
            paymentMethod: '',
            listPayment: [],
            isConfirmed: false
        };
    }

    async componentDidMount() {
        await this.loadPaymentMethods();
        this.initializeData();
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.bookingData !== this.props.bookingData || prevProps.language !== this.props.language) {
            this.initializeData();
        }
    }

    loadPaymentMethods = async () => {
        try {
            let res = await getALLCodeService('PAYMENT');
            if (res && res.errCode === 0) {
                this.setState({
                    listPayment: res.data || []
                });
            }
        } catch (e) {
            console.error('Error loading payment methods:', e);
        }
    }

    initializeData = () => {
        let { bookingData, language } = this.props;
        if (bookingData && bookingData.doctorData?.Doctor_Infor) {
            let info = bookingData.doctorData.Doctor_Infor;
            let defaultPay = '';
            if (info.paymentTypeData) {
                defaultPay = language === LANGUAGES.VI 
                    ? info.paymentTypeData.valueVi 
                    : info.paymentTypeData.valueEn;
            }
            this.setState({
                priceVi: info.priceTypeData ? info.priceTypeData.valueVi : '200000',
                priceEn: info.priceTypeData ? info.priceTypeData.valueEn : '10',
                paymentMethod: defaultPay,
                isConfirmed: false
            });
        } else {
            this.setState({
                priceVi: '200000',
                priceEn: '10',
                paymentMethod: '',
                isConfirmed: false
            });
        }
    }

    handleOnChangeInput = (event, id) => {
        let copyState = { ...this.state };
        copyState[id] = event.target.value;
        this.setState({ ...copyState });
    }

    handleCheckboxChange = (event) => {
        this.setState({ isConfirmed: event.target.checked });
    }

    handleConfirm = () => {
        let { language, handleConfirmPayment, bookingData } = this.props;
        let { priceVi, priceEn, paymentMethod, isConfirmed } = this.state;

        if (!isConfirmed) {
            toast.warning(language === LANGUAGES.VI 
                ? 'Vui lòng xác nhận bệnh nhân đã hoàn tất thủ tục!' 
                : 'Please confirm the patient has completed the checkup procedure!'
            );
            return;
        }

        if (!paymentMethod) {
            toast.warning(language === LANGUAGES.VI 
                ? 'Vui lòng chọn hình thức thanh toán!' 
                : 'Please select a payment method!'
            );
            return;
        }

        let priceStr = `${priceVi} / ${priceEn}`;
        handleConfirmPayment(bookingData.id, priceStr, paymentMethod);
    }

    render() {
        let { isOpenModal, closeConfirmModal, bookingData, language } = this.props;
        let { priceVi, priceEn, paymentMethod, listPayment, isConfirmed } = this.state;

        let patientName = '';
        let doctorName = '';
        if (bookingData) {
            patientName = bookingData.patientData 
                ? `${bookingData.patientData.firstName || ''} ${bookingData.patientData.lastName || ''}` 
                : '';
            doctorName = bookingData.doctorData 
                ? (language === LANGUAGES.VI 
                    ? `${bookingData.doctorData.lastName} ${bookingData.doctorData.firstName}`
                    : `${bookingData.doctorData.firstName} ${bookingData.doctorData.lastName}`)
                : '';
        }

        return (
            <Modal 
                isOpen={isOpenModal} 
                toggle={closeConfirmModal} 
                className="confirm-payment-modal"
                centered
            >
                <div className="modal-header header-payment text-white">
                    <h5 className="modal-title">
                        <i className="fa-solid fa-file-invoice-dollar"></i>{' '}
                        {language === LANGUAGES.VI ? 'Thanh toán & Hoàn tất thủ tục' : 'Checkout & Confirm Payment'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeConfirmModal}></button>
                </div>

                <div className="modal-body payment-body">
                    <div className="patient-summary-box mb-3">
                        <div className="row-item">
                            <span className="label-text">{language === LANGUAGES.VI ? 'Bệnh nhân:' : 'Patient Name:'}</span>
                            <span className="value-text highlight">{patientName}</span>
                        </div>
                        <div className="row-item">
                            <span className="label-text">{language === LANGUAGES.VI ? 'Bác sĩ phụ trách:' : 'Doctor:'}</span>
                            <span className="value-text">{doctorName}</span>
                        </div>
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label font-weight-bold">
                            <i className="fa-solid fa-coins text-warning mr-1"></i>{' '}
                            {language === LANGUAGES.VI ? 'Số tiền thanh toán thực tế (VNĐ)' : 'Amount (VND)'}
                        </label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={priceVi}
                            onChange={(e) => this.handleOnChangeInput(e, 'priceVi')}
                            placeholder="e.g. 200000"
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label font-weight-bold">
                            <i className="fa-solid fa-dollar-sign text-success mr-1"></i>{' '}
                            {language === LANGUAGES.VI ? 'Số tiền thanh toán thực tế (USD)' : 'Amount (USD)'}
                        </label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={priceEn}
                            onChange={(e) => this.handleOnChangeInput(e, 'priceEn')}
                            placeholder="e.g. 10"
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label font-weight-bold">
                            <i className="fa-solid fa-credit-card text-primary mr-1"></i>{' '}
                            {language === LANGUAGES.VI ? 'Phương thức thanh toán thực tế' : 'Actual Payment Method'}
                        </label>
                        <select 
                            className="form-select select-payment"
                            value={paymentMethod}
                            onChange={(e) => this.handleOnChangeInput(e, 'paymentMethod')}
                        >
                            <option value="">{language === LANGUAGES.VI ? '-- Chọn phương thức thanh toán --' : '-- Select payment method --'}</option>
                            {listPayment && listPayment.length > 0 && 
                                listPayment.map((item, index) => {
                                    let val = language === LANGUAGES.VI ? item.valueVi : item.valueEn;
                                    return (
                                        <option key={index} value={val}>
                                            {val}
                                        </option>
                                    );
                                })
                            }
                        </select>
                    </div>

                    <div className="form-check check-confirm mt-4 mb-2">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="confirmSign" 
                            checked={isConfirmed}
                            onChange={this.handleCheckboxChange}
                        />
                        <label className="form-check-label select-label-check" htmlFor="confirmSign">
                            {language === LANGUAGES.VI 
                                ? 'Bệnh nhân đã ký biên nhận và hoàn tất thủ tục khám bệnh' 
                                : 'Patient has signed the receipt and completed the checkup procedure'
                            }
                        </label>
                    </div>
                </div>

                <div className="modal-footer">
                    <Button color="success" className="px-4 text-white font-weight-bold" onClick={this.handleConfirm}>
                        <i className="fa-solid fa-circle-check"></i> {language === LANGUAGES.VI ? 'Hoàn tất thanh toán' : 'Complete checkout'}
                    </Button>
                    <Button color="secondary" className="px-3" onClick={closeConfirmModal}>
                        {language === LANGUAGES.VI ? 'Đóng' : 'Close'}
                    </Button>
                </div>
            </Modal>
        );
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

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmPaymentModal);
