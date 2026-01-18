import React, { Component } from 'react';
import { Modal, Button } from 'reactstrap';

class CancelBookingModal extends Component {

    handleCancelBooking = () => {
        this.props.cancelBooking(this.props.dataModal);
        this.props.closeCancelModal();
    }

    render() {
        let { isOpenModal, closeCancelModal, dataModal } = this.props;

        return (
            <Modal isOpen={isOpenModal} toggle={closeCancelModal} centered>
                <div className="modal-header">
                    <h5 className="modal-title">Xác nhận hủy lịch khám</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeCancelModal}></button>
                </div>

                <div className="modal-body">
                    <p>
                        Bạn có chắc chắn muốn hủy lịch khám của bệnh nhân
                        <b> {dataModal.patientName}</b> không?
                    </p>
                </div>

                <div className="modal-footer">
                    <Button color="primary" onClick={this.handleCancelBooking}>
                        Xác nhận hủy
                    </Button>
                    <Button color="secondary" onClick={closeCancelModal}>
                        Đóng
                    </Button>
                </div>
            </Modal>
        );
    }
}

export default CancelBookingModal;
