import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { getAllSpecialty } from '../../../services/userService';
import './AllSpecialty.scss';
import HomeHeader from '../../HomePage/HomeHeader';
import HomeFooter from '../../HomePage/HomeFooter';
import { LANGUAGES } from '../../../utils';

class AllSpecialty extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSpecialty: [],
            filteredSpecialty: [],
            searchQuery: '',
            isLoading: true
        }
    }

    async componentDidMount() {
        this.setState({ isLoading: true });
        let res = await getAllSpecialty();
        if (res && res.errCode === 0) {
            this.setState({
                dataSpecialty: res.data || [],
                filteredSpecialty: res.data || [],
                isLoading: false
            })
        } else {
            this.setState({ isLoading: false });
        }
    }

    handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        const { dataSpecialty } = this.state;
        
        let filtered = dataSpecialty;
        if (query) {
            filtered = dataSpecialty.filter(item => {
                const name = item.name.toLowerCase();
                return name.includes(query);
            });
        }

        this.setState({
            searchQuery: query,
            filteredSpecialty: filtered
        });
    }

    handleViewDetailSpecialty = (item) => {
        this.props.history.push(`/detail-specialty/${item.id}`);
    }

    render() {
        let { filteredSpecialty, searchQuery, isLoading } = this.state;
        let { language } = this.props;
        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />

                <div className="all-specialty-container">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb">
                        <a href="/home">Trang chủ</a>
                        <i className="fa-solid fa-chevron-right"></i>
                        <span className="current">{language === LANGUAGES.VI ? 'Chuyên khoa khám bệnh' : 'Medical Specialties'}</span>
                    </nav>

                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">{language === LANGUAGES.VI ? 'Chuyên khoa khám bệnh' : 'Medical Specialties'}</h1>
                        <p className="page-description">
                            {language === LANGUAGES.VI ? 'Tìm kiếm và đặt lịch với các chuyên khoa phù hợp' : 'Search and book appointments with suitable specialties'}
                        </p>
                    </div>

                    {/* Mobile Filter + Search */}
                    <div className="mobile-filters">
                        <div className="mobile-search">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder={language === LANGUAGES.VI ? "Tìm chuyên khoa" : "Search specialties"}
                                value={searchQuery}
                                onChange={this.handleSearch}
                            />
                        </div>
                    </div>

                    <div className="specialty-layout">
                        {/* Sidebar Filter (Desktop) */}
                        <aside className="sidebar-filter">
                            <div className="filter-card">
                                <h3 className="filter-title">Bộ lọc</h3>

                                {/* Search */}
                                <div className="filter-group">
                                    <label className="filter-label">Tìm chuyên khoa</label>
                                    <div className="search-input-wrapper">
                                        <i className="fa-solid fa-magnifying-glass"></i>
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Tên chuyên khoa"
                                            value={searchQuery}
                                            onChange={this.handleSearch}
                                        />
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="results-count">
                                    Hiển thị <span>{filteredSpecialty.length}</span> chuyên khoa
                                </div>
                            </div>
                        </aside>

                        {/* Specialty Listing */}
                        <section className="specialty-listing">
                            {isLoading ? (
                                <div className="loading-state">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Đang tải danh sách chuyên khoa...</p>
                                </div>
                            ) : filteredSpecialty.length > 0 ? (
                                <div className="specialties-list">
                                    {filteredSpecialty.map((item, index) => (
                                        <div className="specialty-card" key={index}>
                                            <div className="specialty-image">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} />
                                                ) : (
                                                    <div className="specialty-avatar-placeholder">
                                                        <i className="fa-solid fa-stethoscope"></i>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="specialty-content">
                                                <div className="specialty-info">
                                                    <div className="info-header">
                                                        <h2 className="specialty-name">{item.name}</h2>
                                                    </div>
                                                </div>

                                                <div className="specialty-actions">
                                                    <button
                                                        className="btn-view-profile"
                                                        onClick={() => this.handleViewDetailSpecialty(item)}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="fa-solid fa-stethoscope"></i>
                                    </div>
                                    <h3 className="empty-title">Không tìm thấy chuyên khoa</h3>
                                    <p className="empty-description">
                                        Không có chuyên khoa nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại.
                                    </p>
                                    <button
                                        className="btn-reset"
                                        onClick={() => {
                                            this.setState({
                                                searchQuery: '',
                                                filteredSpecialty: this.state.dataSpecialty
                                            });
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
        )
    }
}

const mapStateToProps = state => ({
    language: state.app.language
});

export default withRouter(connect(mapStateToProps)(AllSpecialty));
