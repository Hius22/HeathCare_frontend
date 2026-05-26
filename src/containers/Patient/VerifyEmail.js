import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import { postVerifyBookingAppointment } from '../../services/userService';
import HomeHeader from '../HomePage/HomeHeader';
import { withRouter } from 'react-router';
import './VerifyEmail.scss';
class VerifyEmail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            statusVerify: false,
            errCode: 0,
            countdown: 5
        }
    }

    countdownInterval = null;

    async componentDidMount() {
        if (this.props.location && this.props.location.search) {
            let urlParams = new URLSearchParams(this.props.location.search);
            let token = urlParams.get('token');
            let doctorId = urlParams.get('doctorId');
            let res = await postVerifyBookingAppointment({
                token: token,
                doctorId: doctorId
            })

            if (res && res.errCode === 0) {
                this.setState({ statusVerify: true, errCode: 0 });
                // Auto-redirect to appointments after 5 seconds
                let count = 5;
                this.countdownInterval = setInterval(() => {
                    count -= 1;
                    this.setState({ countdown: count });
                    if (count <= 0) {
                        clearInterval(this.countdownInterval);
                        this.props.history.push('/appointments');
                    }
                }, 1000);
            } else {
                this.setState({ statusVerify: true, errCode: res && res.errCode ? res.errCode : -1 });
            }
        }
    }

    componentWillUnmount() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {}

    render() {
        let { statusVerify, errCode, countdown } = this.state;

        return (
            <>
                <HomeHeader />
                <div className='verify-email-container'>
                    {statusVerify === false ?
                        <div className='loading-state'>
                            <i className='fa-solid fa-spinner fa-spin'></i>
                            <p>Đang xác nhận lịch hẹn...</p>
                        </div>
                        :
                        <div>
                            {+errCode === 0 ?
                                    <div className='infor-booking success'>
                                        <div className='icon-success'>
                                            <i className='fa-solid fa-circle-check'></i>
                                        </div>
                                        <h2>Xác nhận lịch hẹn thành công!</h2>
                                        <p>Cảm ơn bạn đã đặt lịch khám. Lịch hẹn của bạn đã được xác nhận.</p>
                                        <p className='redirect-countdown'>Tự động chuyển đến lịch hẹn sau <strong>{countdown}s</strong>...</p>
                                        <div className='booking-actions'>
                                            <button
                                                className='btn-primary'
                                                onClick={() => this.props.history.push('/home')}
                                            >
                                                <i className='fa-solid fa-house'></i>
                                                Về trang chủ
                                            </button>
                                            <button
                                                className='btn-secondary'
                                                onClick={() => this.props.history.push('/appointments')}
                                            >
                                                <i className='fa-solid fa-calendar-check'></i>
                                                Xem lịch hẹn của tôi
                                            </button>
                                        </div>
                                    </div>
                                :
                                <div className='infor-booking error'>
                                    <div className='icon-error'>
                                        <i className='fa-solid fa-circle-xmark'></i>
                                    </div>
                                    <h2>Lịch hẹn không tồn tại hoặc đã được xác nhận!</h2>
                                    <p>Link xác nhận có thể đã hết hạn hoặc lịch hẹn đã được xác nhận trước đó.</p>
                                    <div className='booking-actions'>
                                        <button
                                            className='btn-primary'
                                            onClick={() => this.props.history.push('/home')}
                                        >
                                            <i className='fa-solid fa-house'></i>
                                            Về trang chủ
                                        </button>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>
            </>
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(VerifyEmail));
