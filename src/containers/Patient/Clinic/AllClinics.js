import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import HomeHeader from '../../HomePage/HomeHeader';
import HomeFooter from '../../HomePage/HomeFooter';
import { getAllClinic } from '../../../services/userService';
import './AllClinics.scss';

class AllClinics extends Component {
    constructor(props) {
        super(props);
        this.state = {
            listClinics: [],
            isLoading: true
        };
    }

    async componentDidMount() {
        await this.loadClinic();
    }

    loadClinic = async () => {
        this.setState({ isLoading: true });
        let res = await getAllClinic();
        if (res && res.errCode === 0) {
            this.setState({
                listClinics: res.data || [],
                isLoading: false
            });
        } else {
            this.setState({ isLoading: false });
        }
    }

    handleViewDetail = (id) => {
        if (id) {
            this.props.history.push(`/detail-clinic/${id}`);
        }
    }

    handleBookAppointment = () => {
        this.props.history.push('/booking-flow');
    }

    handleGetDirections = (address) => {
        if (address) {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
        }
    }

    render() {
        const { listClinics, isLoading } = this.state;

        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />

                <div className="all-clinics-container">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb">
                        <a href="/home" onClick={(e) => { e.preventDefault(); this.props.history.push('/home'); }}>Trang chủ</a>
                        <i className="fa-solid fa-chevron-right"></i>
                        <span className="current">Cơ sở y tế</span>
                    </nav>

                    {/* Page Header */}
                    <section className="page-header">
                        <h1 className="page-title">Cơ sở y tế</h1>
                        <p className="page-description">
                            Thông tin chi tiết về các cơ sở y tế của chúng tôi
                        </p>
                    </section>

                    {/* Clinic Content */}
                    {isLoading ? (
                        <div className="loading-state">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <p>Đang tải thông tin cơ sở y tế...</p>
                        </div>
                    ) : listClinics && listClinics.length > 0 ? (
                        <div className="clinic-grid">
                            {listClinics.map((item, index) => (
                                <div className="clinic-card" key={index}>
                                    <div className="clinic-image-section">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className="clinic-image-placeholder">
                                                <i className="fa-solid fa-hospital"></i>
                                            </div>
                                        )}
                                    </div>

                                    <div className="clinic-info-section">
                                        <div className="clinic-header">
                                            <h2 className="clinic-name">{item.name}</h2>
                                            <div className="clinic-location">
                                                <i className="fa-solid fa-location-dot"></i>
                                                <p>{item.address}</p>
                                            </div>
                                        </div>

                                        <div className="clinic-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={() => this.handleBookAppointment()}
                                            >
                                                <i className="fa-solid fa-calendar-check"></i>
                                                Đặt lịch khám
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => this.handleViewDetail(item.id)}
                                            >
                                                <i className="fa-solid fa-circle-info"></i>
                                                Xem chi tiết
                                            </button>
                                            <button
                                                className="btn-directions"
                                                onClick={() => this.handleGetDirections(item.address)}
                                            >
                                                <i className="fa-solid fa-directions"></i>
                                                Chỉ đường
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className="fa-solid fa-hospital"></i>
                            </div>
                            <h3 className="empty-title">Chưa có thông tin cơ sở y tế</h3>
                            <p className="empty-description">
                                Hệ thống chưa có thông tin cơ sở y tế. Vui lòng quay lại sau.
                            </p>
                        </div>
                    )}
                </div>

                <HomeFooter />
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    language: state.app.language
});

export default withRouter(connect(mapStateToProps)(AllClinics));
