import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import HomeHeader from "../HomePage/HomeHeader";
import HomeFooter from "../HomePage/HomeFooter";
import "./BookingHistory.scss";
import moment from 'moment';
import { getAllBookings, postCancelBooking, updatePatientInfoService, getALLCodeService, getScheduleDoctorByDate, rescheduleBookingService } from "../../services/userService";
import { toast } from "react-toastify";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class BookingHistory extends Component {

    constructor(props) {
        super(props);
        this.state = {
            bookings: [],
            activeTab: 'all',
            searchEmail: '',
            hasSearched: false,
            isLoading: false,

            // State for Edit Info Modal
            isOpenEditModal: false,
            editingBooking: null,
            fullName: '',
            phoneNumber: '',
            address: '',
            selectedGender: '',
            genders: [],

            // State for Reschedule Modal
            isOpenRescheduleModal: false,
            reschedulingBooking: null,
            rescheduleDateStr: '',
            rescheduleTimeSlots: [],
            selectedRescheduleSlot: '',

            // State for Cancel Confirmation Modal
            isOpenCancelModal: false,
            cancellingBooking: null
        };
    }

    getSpecialties = (doctor) => {
        let list = [];
        if (doctor && doctor.doctorSpecialties && doctor.doctorSpecialties.length > 0) {
            doctor.doctorSpecialties.forEach(item => {
                if (item.specialtyData && item.specialtyData.name) {
                    list.push(item.specialtyData);
                }
            });
        }
        if (list.length === 0 && doctor && doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyData) {
            list.push(doctor.Doctor_Infor.specialtyData);
        }
        return list;
    }

    getSpecialtyName = (doctor) => {
        let list = this.getSpecialties(doctor);
        if (list.length > 0) {
            return list.map(item => item.name).join(', ');
        }
        return 'Chuyên khoa';
    }

    componentDidMount() {
        const user = this.props.userInfo;
        if (user?.id) {
            this.getBookingHistory(user.id);
        }
        this.loadGenders();
    }

    componentDidUpdate(prevProps) {
        const oldId = prevProps.userInfo?.id;
        const newId = this.props.userInfo?.id;
        if (oldId !== newId && newId) {
            this.getBookingHistory(newId);
        }
    }

    loadGenders = async () => {
        try {
            let res = await getALLCodeService('GENDER');
            if (res && res.errCode === 0) {
                this.setState({ genders: res.data || [] });
            }
        } catch (e) {
            console.error("Error loading genders:", e);
        }
    };

    handleOpenEditModal = (booking) => {
        this.setState({
            isOpenEditModal: true,
            editingBooking: booking,
            fullName: booking.patientData?.firstName || '',
            phoneNumber: booking.patientData?.phonenumber || '',
            address: booking.patientData?.address || '',
            selectedGender: booking.patientData?.gender || ''
        });
    };

    handleCloseEditModal = () => {
        this.setState({
            isOpenEditModal: false,
            editingBooking: null
        });
    };

    handleSaveEdit = async () => {
        const { editingBooking, fullName, phoneNumber, address, selectedGender } = this.state;
        if (!editingBooking) return;

        if (!fullName.trim() || !phoneNumber.trim() || !address.trim() || !selectedGender) {
            toast.error("Vui lòng điền đầy đủ các thông tin!");
            return;
        }

        // Validate phone number format
        let phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
            toast.error('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam.');
            return;
        }

        this.setState({ isLoading: true });
        try {
            let res = await updatePatientInfoService({
                id: editingBooking.patientId,
                email: editingBooking.patientData?.email || this.state.searchEmail,
                firstName: fullName.trim(),
                lastName: editingBooking.patientData?.lastName || '',
                phonenumber: phoneNumber.trim(),
                address: address.trim(),
                gender: selectedGender,
                language: this.props.language || 'vi'
            });

            if (res && res.errCode === 0) {
                toast.success("Cập nhật thông tin cá nhân thành công!");
                this.setState({ isOpenEditModal: false, editingBooking: null });
                // Refresh list
                if (this.props.userInfo?.id) {
                    this.getBookingHistory(this.props.userInfo.id);
                } else if (this.state.searchEmail) {
                    this.handleSearchEmail();
                }
            } else {
                toast.error(res.errMessage || "Cập nhật thông tin thất bại!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi từ server!");
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleOpenRescheduleModal = (booking) => {
        // Default reschedule date to tomorrow
        const tomorrowStr = moment().add(1, 'days').format('YYYY-MM-DD');
        this.setState({
            isOpenRescheduleModal: true,
            reschedulingBooking: booking,
            rescheduleDateStr: tomorrowStr,
            rescheduleTimeSlots: [],
            selectedRescheduleSlot: ''
        }, () => {
            this.handleRescheduleDateChange(tomorrowStr);
        });
    };

    handleCloseRescheduleModal = () => {
        this.setState({
            isOpenRescheduleModal: false,
            reschedulingBooking: null,
            rescheduleDateStr: '',
            rescheduleTimeSlots: [],
            selectedRescheduleSlot: ''
        });
    };

    handleRescheduleDateChange = async (dateStr) => {
        if (!dateStr) return;
        const { reschedulingBooking } = this.state;
        if (!reschedulingBooking) return;

        this.setState({ rescheduleDateStr: dateStr, rescheduleTimeSlots: [], selectedRescheduleSlot: '' });

        // Convert YYYY-MM-DD to timestamp start of day
        const dateTimestamp = moment(dateStr, 'YYYY-MM-DD').startOf('day').valueOf();

        try {
            let res = await getScheduleDoctorByDate(reschedulingBooking.doctorId, dateTimestamp);
            if (res && res.errCode === 0) {
                // Filter out past timeslots if the chosen date is today
                let slots = res.data || [];
                const isToday = moment(dateStr, 'YYYY-MM-DD').isSame(moment(), 'day');
                if (isToday) {
                    const currentHour = moment().hour();
                    const currentMinute = moment().minute();
                    slots = slots.filter(item => {
                        const timeStr = item.timeTypeData?.valueVi;
                        if (!timeStr) return false;
                        const startStr = timeStr.split(' - ')[0];
                        const [startHour, startMinute] = startStr.split(':').map(Number);
                        return (startHour > currentHour) || (startHour === currentHour && startMinute > currentMinute);
                    });
                }
                this.setState({ rescheduleTimeSlots: slots });
            }
        } catch (e) {
            console.error("Error fetching schedule:", e);
            toast.error("Không thể tải lịch làm việc của bác sĩ.");
        }
    };

    handleConfirmReschedule = async () => {
        const { reschedulingBooking, rescheduleDateStr, selectedRescheduleSlot } = this.state;
        if (!reschedulingBooking || !rescheduleDateStr || !selectedRescheduleSlot) return;

        const dateTimestamp = moment(rescheduleDateStr, 'YYYY-MM-DD').startOf('day').valueOf();

        this.setState({ isLoading: true });
        try {
            let res = await rescheduleBookingService({
                bookingId: reschedulingBooking.id,
                date: dateTimestamp,
                timeType: selectedRescheduleSlot,
                language: this.props.language || 'vi'
            });

            if (res && res.errCode === 0) {
                toast.success("Thay đổi lịch hẹn khám thành công!");
                this.handleCloseRescheduleModal();
                // Refresh list
                if (this.props.userInfo?.id) {
                    this.getBookingHistory(this.props.userInfo.id);
                } else if (this.state.searchEmail) {
                    this.handleSearchEmail();
                }
            } else {
                toast.error(res.errMessage || "Thay đổi lịch hẹn thất bại!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi kết nối máy chủ!");
        } finally {
            this.setState({ isLoading: false });
        }
    };

    getBookingHistory = async (userId) => {
        if (!userId) return;
        this.setState({ isLoading: true });
        try {
            let res = await getAllBookings({ patientId: userId });
            if (res && res.errCode === 0) {
                this.setState({ bookings: res.data || [], hasSearched: true });
            }
        } catch (e) {
            console.error("API ERROR:", e);
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleSearchEmail = async () => {
        const { searchEmail } = this.state;
        if (!searchEmail.trim()) {
            toast.error("Vui lòng nhập email để tra cứu!");
            return;
        }
        this.setState({ isLoading: true });
        try {
            let res = await getAllBookings({ patientEmail: searchEmail.trim() });
            if (res && res.errCode === 0) {
                this.setState({ bookings: res.data || [], hasSearched: true, activeTab: 'all' });
                if (!res.data || res.data.length === 0) {
                    toast.info("Không có thông tin về lịch khám với email này.");
                } else {
                    toast.success(`Tìm thấy ${res.data.length} lịch hẹn!`);
                }
            } else {
                toast.error("Tra cứu thất bại!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi kết nối máy chủ!");
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleOpenCancelModal = (item) => {
        this.setState({
            isOpenCancelModal: true,
            cancellingBooking: item
        });
    };

    handleCloseCancelModal = () => {
        this.setState({
            isOpenCancelModal: false,
            cancellingBooking: null
        });
    };

    handleConfirmCancelBooking = async () => {
        const { cancellingBooking } = this.state;
        if (!cancellingBooking) return;

        this.setState({ isLoading: true });
        try {
            let res = await postCancelBooking({
                doctorId: cancellingBooking.doctorId,
                patientId: cancellingBooking.patientId,
                timeType: cancellingBooking.timeType,
                date: cancellingBooking.date
            });
            if (res && res.errCode === 0) {
                toast.success("Hủy lịch hẹn thành công!");
                this.handleCloseCancelModal();
                // Refresh
                if (this.props.userInfo?.id) {
                    this.getBookingHistory(this.props.userInfo.id);
                } else if (this.state.searchEmail) {
                    this.handleSearchEmail();
                }
            } else {
                toast.error(res?.errMessage || "Hủy lịch hẹn thất bại!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi xảy ra từ máy chủ!");
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleTabChange = (tab) => {
        this.setState({ activeTab: tab });
    };

    formatDate = (timestamp) => {
        const date = moment(+timestamp);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayOfWeek = days[date.day()];
        const fullDate = date.format('DD/MM/YYYY');
        return `${dayOfWeek}, ${fullDate}`;
    };

    getStatusLabel = (statusId) => {
        const map = { S1: 'Chờ xác nhận', S2: 'Đã xác nhận', S3: 'Đã khám', S4: 'Đã hủy' };
        return map[statusId] || statusId;
    };

    getGenderLabel = (genderKey) => {
        const { genders } = this.state;
        const { language } = this.props;
        if (!genders || genders.length === 0) return genderKey || '—';
        const genderObj = genders.find(g => g.keyMap === genderKey);
        if (genderObj) {
            return language === 'vi' ? genderObj.valueVi : genderObj.valueEn;
        }
        return genderKey || '—';
    };

    getFilteredBookings = () => {
        const { bookings, activeTab } = this.state;
        const now = moment().startOf('day');

        if (activeTab === 'all') return bookings;

        if (activeTab === 'upcoming') {
            return bookings.filter(item =>
                (item.statusId === 'S1' || item.statusId === 'S2') &&
                moment(+item.date).startOf('day').isSameOrAfter(now)
            );
        }
        if (activeTab === 'past') {
            return bookings.filter(item =>
                item.statusId === 'S3' ||
                (item.statusId === 'S2' && moment(+item.date).startOf('day').isBefore(now))
            );
        }
        if (activeTab === 'cancelled') {
            return bookings.filter(item => item.statusId === 'S4');
        }
        return [];
    };

    render() {
        const { activeTab, bookings, hasSearched, isLoading, searchEmail } = this.state;
        const filteredBookings = this.getFilteredBookings();

        const countAll = bookings.length;
        const now = moment().startOf('day');
        const countUpcoming = bookings.filter(item =>
            (item.statusId === 'S1' || item.statusId === 'S2') &&
            moment(+item.date).startOf('day').isSameOrAfter(now)
        ).length;
        const countPast = bookings.filter(item =>
            item.statusId === 'S3' || (item.statusId === 'S2' && moment(+item.date).startOf('day').isBefore(now))
        ).length;
        const countCancelled = bookings.filter(item => item.statusId === 'S4').length;

        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />

                <div className="booking-history-container">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb">
                        <a href="/home">Trang chủ</a>
                        <i className="fa-solid fa-chevron-right"></i>
                        <span className="current">Lịch hẹn của tôi</span>
                    </nav>

                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">Lịch hẹn của tôi</h1>
                        <p className="page-description">
                            Tra cứu và quản lý lịch hẹn khám bệnh của bạn.
                        </p>
                    </div>

                    {/* Search Form - Always visible */}
                    <div className="search-container" style={{
                        marginBottom: '24px', padding: '24px',
                        background: '#f0f7ff', borderRadius: '12px',
                        border: '1px solid #cce5ff'
                    }}>
                        <h3 style={{ fontSize: '17px', marginBottom: '12px', color: '#1a5fbc', fontWeight: 600 }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }}></i>
                            Tra cứu lịch khám bằng Email
                        </h3>
                        <p style={{ fontSize: '14px', color: '#555', marginBottom: '14px' }}>
                            Nhập email bạn đã dùng khi đặt lịch khám để xem danh sách lịch hẹn.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                placeholder="Ví dụ: patient@email.com"
                                value={searchEmail}
                                onChange={(e) => this.setState({ searchEmail: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && this.handleSearchEmail()}
                                style={{
                                    padding: '10px 15px', flex: '1', minWidth: '260px',
                                    borderRadius: '6px', border: '1px solid #a8cfff',
                                    fontSize: '14px', outline: 'none'
                                }}
                            />
                            <button
                                onClick={this.handleSearchEmail}
                                disabled={isLoading}
                                style={{
                                    padding: '10px 24px', background: '#1a73e8',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                {isLoading ? 'Đang tìm...' : 'Tra cứu'}
                            </button>
                        </div>
                    </div>

                    {/* Show content only after search or login */}
                    {!hasSearched ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className="fa-solid fa-calendar-heart"></i>
                            </div>
                            <h3 className="empty-title">Chưa có dữ liệu</h3>
                            <p className="empty-description">
                                Nhập email của bạn ở ô bên trên để tra cứu lịch hẹn đã đặt.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="tabs-container">
                                <button
                                    className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('all')}
                                >
                                    Tất cả ({countAll})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('upcoming')}
                                >
                                    Sắp tới ({countUpcoming})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('past')}
                                >
                                    Đã khám ({countPast})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('cancelled')}
                                >
                                    Đã hủy ({countCancelled})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="appointments-content">
                                {filteredBookings.length > 0 ? (
                                    <div className="appointments-grid">
                                        {filteredBookings.map((item, index) => (
                                            <div className="appointment-card" key={index}>
                                                <div className="card-content">
                                                    {/* Doctor Image */}
                                                    <div className="doctor-image">
                                                        {item.doctorData?.image ? (
                                                            <img
                                                                src={item.doctorData.image}
                                                                alt={`BS. ${item.doctorData?.firstName}`}
                                                            />
                                                        ) : (
                                                            <div className="doctor-avatar">
                                                                {(item.doctorData?.lastName?.charAt(0) || '') + (item.doctorData?.firstName?.charAt(0) || '')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Appointment Info */}
                                                    <div className="appointment-info">
                                                        <div className="info-header">
                                                            <div>
                                                                <h3 className="doctor-name">
                                                                    BS. {item.doctorData ? `${item.doctorData.lastName || ''} ${item.doctorData.firstName || ''}`.trim() : '—'}
                                                                </h3>
                                                                <p className="doctor-specialty">
                                                                    {this.getSpecialtyName(item.doctorData)}
                                                                </p>
                                                            </div>
                                                            <span className={`status-badge ${item.statusId}`}>
                                                                {item.statusData?.valueVi || this.getStatusLabel(item.statusId)}
                                                            </span>
                                                        </div>

                                                        <div className="appointment-details">
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-calendar-days"></i>
                                                                <span>{this.formatDate(item.date)}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-clock"></i>
                                                                <span>{item.timeTypeDataPatient?.valueVi || item.timeType}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-user"></i>
                                                                <span><strong>Bệnh nhân:</strong> {item.patientData?.firstName || '—'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-phone"></i>
                                                                <span><strong>SĐT:</strong> {item.patientData?.phonenumber || '—'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-location-dot"></i>
                                                                <span><strong>Địa chỉ:</strong> {item.patientData?.address || '—'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-venus-mars"></i>
                                                                <span><strong>Giới tính:</strong> {this.getGenderLabel(item.patientData?.gender)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        {(item.statusId === 'S1' || item.statusId === 'S2') &&
                                                            moment(+item.date).startOf('day').isSameOrAfter(moment().startOf('day')) && (
                                                            <div className="card-actions">
                                                                <button
                                                                    className="btn-reschedule"
                                                                    onClick={() => this.handleOpenRescheduleModal(item)}
                                                                >
                                                                    Đổi lịch
                                                                </button>
                                                                <button
                                                                    className="btn-cancel"
                                                                    onClick={() => this.handleOpenCancelModal(item)}
                                                                >
                                                                    Hủy lịch
                                                                </button>
                                                                <button
                                                                    className="btn-edit-info"
                                                                    onClick={() => this.handleOpenEditModal(item)}
                                                                    style={{
                                                                        backgroundColor: '#e8f0fe',
                                                                        color: '#1a73e8',
                                                                        border: '1px solid #1a73e8',
                                                                        borderRadius: '8px',
                                                                        padding: '8px 16px',
                                                                        fontSize: '14px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    Sửa thông tin
                                                                </button>
                                                            </div>
                                                        )}

                                                        {item.statusId === 'S3' && (
                                                            <div className="card-actions">
                                                                <a href={`/detail-doctor/${item.doctorId}`} className="btn-view-profile">
                                                                    Xem hồ sơ bác sĩ
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <i className="fa-solid fa-calendar-xmark"></i>
                                        </div>
                                        <h3 className="empty-title">
                                            {activeTab === 'all' && 'Không có thông tin về lịch khám'}
                                            {activeTab === 'upcoming' && 'Không có lịch hẹn sắp tới'}
                                            {activeTab === 'past' && 'Chưa có lịch sử khám bệnh'}
                                            {activeTab === 'cancelled' && 'Không có lịch hẹn đã hủy'}
                                        </h3>
                                        <p className="empty-description">
                                            {activeTab === 'upcoming' && 'Bạn chưa có lịch hẹn nào sắp tới.'}
                                            {activeTab === 'past' && 'Bạn chưa có lịch sử khám bệnh nào.'}
                                            {activeTab === 'cancelled' && 'Không có lịch hẹn nào đã bị hủy.'}
                                            {activeTab === 'all' && 'Không tìm thấy thông tin về lịch khám nào.'}
                                        </p>
                                        <button
                                            className="btn-book-now"
                                            onClick={() => this.props.history.push('/booking-flow')}
                                        >
                                            Đặt lịch mới
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Edit Patient Info Modal */}
                    <Modal
                        isOpen={this.state.isOpenEditModal}
                        toggle={this.handleCloseEditModal}
                        className="edit-patient-modal"
                        centered
                    >
                        <ModalHeader>
                            <i className="fa-solid fa-user-pen header-icon"></i>
                            Chỉnh sửa thông tin cá nhân bệnh nhân
                        </ModalHeader>
                        <ModalBody>
                            <div className="form-group mb-3">
                                <label className="form-label">Họ và tên <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control text-input"
                                    value={this.state.fullName}
                                    onChange={(e) => this.setState({ fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Số điện thoại <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control text-input"
                                    value={this.state.phoneNumber}
                                    onChange={(e) => this.setState({ phoneNumber: e.target.value })}
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Địa chỉ liên hệ <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control text-input"
                                    value={this.state.address}
                                    onChange={(e) => this.setState({ address: e.target.value })}
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Giới tính <span className="text-danger">*</span></label>
                                <select
                                    className="form-control select-input"
                                    value={this.state.selectedGender}
                                    onChange={(e) => this.setState({ selectedGender: e.target.value })}
                                >
                                    <option value="">-- Chọn giới tính --</option>
                                    {this.state.genders.map((g, idx) => (
                                        <option key={idx} value={g.keyMap}>
                                            {this.props.language === 'vi' ? g.valueVi : g.valueEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button
                                className="btn btn-secondary btn-cancel"
                                onClick={this.handleCloseEditModal}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className="btn btn-primary btn-save"
                                onClick={this.handleSaveEdit}
                            >
                                Lưu thay đổi
                            </button>
                        </ModalFooter>
                    </Modal>

                    {/* Reschedule Booking Modal */}
                    <Modal
                        isOpen={this.state.isOpenRescheduleModal}
                        toggle={this.handleCloseRescheduleModal}
                        className="reschedule-modal"
                        centered
                        size="md"
                    >
                        <ModalHeader>
                            <div className="modal-title-custom">
                                <i className="fa-solid fa-calendar-plus header-icon"></i> Thay đổi lịch hẹn khám bệnh
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {this.state.reschedulingBooking && (
                                <div className="reschedule-modal-body">
                                    <div className="doctor-info-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">Bác sĩ khám:</span>
                                            <span className="summary-val text-primary-dark">BS. {this.state.reschedulingBooking.doctorData ? `${this.state.reschedulingBooking.doctorData.lastName || ''} ${this.state.reschedulingBooking.doctorData.firstName || ''}`.trim() : '—'}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Chuyên khoa:</span>
                                            <span className="summary-val">{this.getSpecialtyName(this.state.reschedulingBooking.doctorData)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Bệnh nhân:</span>
                                            <span className="summary-val">{this.state.reschedulingBooking.patientData?.firstName || '—'}</span>
                                        </div>
                                        <div className="current-schedule-info">
                                            <span className="summary-label">Lịch hẹn hiện tại:</span>
                                            <span className="current-badge">
                                                {this.state.reschedulingBooking.timeTypeDataPatient?.valueVi || this.state.reschedulingBooking.timeType} - {this.formatDate(this.state.reschedulingBooking.date)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="reschedule-inputs">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Chọn ngày khám mới:</label>
                                            <input
                                                type="date"
                                                className="form-control reschedule-date-picker"
                                                value={this.state.rescheduleDateStr}
                                                min={moment().add(1, 'days').format('YYYY-MM-DD')} // Can only reschedule from tomorrow
                                                onChange={(e) => this.handleRescheduleDateChange(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="form-label">Chọn khung giờ khám mới:</label>
                                            {this.state.rescheduleTimeSlots && this.state.rescheduleTimeSlots.length > 0 ? (
                                                <div className="reschedule-slots-grid">
                                                    {this.state.rescheduleTimeSlots.map((slot, idx) => {
                                                        const timeLabel = this.props.language === 'vi' ? slot.timeTypeData?.valueVi : slot.timeTypeData?.valueEn;
                                                        const isSelected = this.state.selectedRescheduleSlot === slot.timeType;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`btn-slot-select ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => this.setState({ selectedRescheduleSlot: slot.timeType })}
                                                            >
                                                                {timeLabel}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="no-slots-alert">
                                                    <i className="fa-solid fa-circle-exclamation me-2"></i> Không có khung giờ làm việc nào trống cho bác sĩ vào ngày đã chọn. Vui lòng chọn ngày khác.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <button
                                className="btn btn-secondary btn-cancel"
                                onClick={this.handleCloseRescheduleModal}
                            >
                                Đóng
                            </button>
                            <button
                                className="btn btn-primary btn-confirm-reschedule"
                                disabled={!this.state.selectedRescheduleSlot}
                                onClick={this.handleConfirmReschedule}
                            >
                                Xác nhận đổi lịch
                            </button>
                        </ModalFooter>
                    </Modal>

                    {/* Confirm Cancel Booking Modal */}
                    <Modal
                        isOpen={this.state.isOpenCancelModal}
                        toggle={this.handleCloseCancelModal}
                        className="cancel-booking-modal"
                        centered
                        size="sm"
                    >
                        <ModalHeader>
                            <div className="modal-title-custom text-danger">
                                <i className="fa-solid fa-circle-exclamation header-icon text-danger"></i> Xác nhận hủy lịch hẹn
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {this.state.cancellingBooking && (
                                <div className="cancel-modal-body text-center">
                                    <p className="mb-2">Bạn có chắc chắn muốn hủy lịch hẹn khám bệnh này?</p>
                                    <div className="booking-summary-box">
                                        <p><strong>Bác sĩ:</strong> BS. {this.state.cancellingBooking.doctorData ? `${this.state.cancellingBooking.doctorData.lastName || ''} ${this.state.cancellingBooking.doctorData.firstName || ''}`.trim() : '—'}</p>
                                        <p><strong>Thời gian:</strong> {this.state.cancellingBooking.timeTypeDataPatient?.valueVi || this.state.cancellingBooking.timeType} - {this.formatDate(this.state.cancellingBooking.date)}</p>
                                    </div>
                                    <p className="text-muted small mt-2">Hành động này không thể hoàn tác.</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="justify-content-center">
                            <button
                                className="btn btn-secondary"
                                onClick={this.handleCloseCancelModal}
                                style={{ borderRadius: '8px', padding: '8px 20px' }}
                            >
                                Quay lại
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={this.handleConfirmCancelBooking}
                                style={{ borderRadius: '8px', padding: '8px 20px' }}
                            >
                                Đồng ý hủy
                            </button>
                        </ModalFooter>
                    </Modal>
                </div>

                <HomeFooter />
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        userInfo: state.user.userInfo,
        language: state.app.language
    };
};

export default withRouter(connect(mapStateToProps)(BookingHistory));