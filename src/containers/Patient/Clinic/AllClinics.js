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
            filteredClinics: [],
            searchQuery: '',
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
                filteredClinics: res.data || [],
                isLoading: false
            }, () => {
                if (this.props.location && this.props.location.search) {
                    const params = new URLSearchParams(this.props.location.search);
                    const searchParam = params.get('search') || '';
                    if (searchParam) {
                        this.handleSearch({ target: { value: searchParam } });
                    }
                }
            });
        } else {
            this.setState({ isLoading: false });
        }
    }

    handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        const { listClinics } = this.state;
        
        let filtered = listClinics;
        if (query) {
            filtered = listClinics.filter(item => {
                const name = item.name ? item.name.toLowerCase() : '';
                const address = item.address ? item.address.toLowerCase() : '';
                return name.includes(query) || address.includes(query);
            });
        }

        this.setState({
            searchQuery: query,
            filteredClinics: filtered
        });
    }

    handleViewDetail = (id) => {
        if (id) {
            this.props.history.push(`/detail-clinic/${id}`);
        }
    }

    handleBookAppointment = (id) => {
        if (id) {
            this.props.history.push(`/booking-flow?clinicId=${id}`);
        } else {
            this.props.history.push('/booking-flow');
        }
    }

    handleGetDirections = (address) => {
        if (address) {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
        }
    }

    render() {
        const { filteredClinics, searchQuery, isLoading } = this.state;

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

                    {/* Mobile Filter + Search */}
                    <div className="mobile-filters">
                        <div className="mobile-search">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder="Tìm cơ sở y tế"
                                value={searchQuery}
                                onChange={this.handleSearch}
                            />
                        </div>
                    </div>

                    <div className="clinics-layout">
                        {/* Sidebar Filter (Desktop) */}
                        <aside className="sidebar-filter">
                            <div className="filter-card">
                                <h3 className="filter-title">Bộ lọc</h3>

                                {/* Search */}
                                <div className="filter-group">
                                    <label className="filter-label">Tìm cơ sở y tế</label>
                                    <div className="search-input-wrapper">
                                        <i className="fa-solid fa-magnifying-glass"></i>
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Tên hoặc địa chỉ"
                                            value={searchQuery}
                                            onChange={this.handleSearch}
                                        />
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="results-count">
                                    Hiển thị <span>{filteredClinics.length}</span> cơ sở
                                </div>
                            </div>
                        </aside>

                        {/* Clinic Listing */}
                        <section className="clinics-listing">
                            {isLoading ? (
                                <div className="loading-state">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Đang tải thông tin cơ sở y tế...</p>
                                </div>
                            ) : filteredClinics && filteredClinics.length > 0 ? (
                                <div className="clinic-grid">
                                    {filteredClinics.map((item, index) => (
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
                                                        onClick={() => this.handleBookAppointment(item.id)}
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
                                    <h3 className="empty-title">Không tìm thấy cơ sở y tế</h3>
                                    <p className="empty-description">
                                        Không tìm thấy cơ sở y tế nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại.
                                    </p>
                                    <button
                                        className="btn-reset"
                                        onClick={() => {
                                            this.setState({
                                                searchQuery: '',
                                                filteredClinics: this.state.listClinics
                                            });
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '10px 24px',
                                            borderRadius: '9999px',
                                            backgroundColor: '#006591',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginTop: '16px'
                                        }}
                                    >
                                        Đặt lại bộ lọc
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
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
