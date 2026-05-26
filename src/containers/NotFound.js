import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <div className="error-icon">
                    <i className="fas fa-heartbeat"></i>
                </div>
                <h1 className="error-title">Trang không tồn tại</h1>
                <p className="error-description">
                    Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <div className="error-actions">
                    <Link to="/home" className="btn-home">
                        <i className="fas fa-home"></i>
                        Về trang chủ
                    </Link>
                    <Link to="/booking-flow" className="btn-booking">
                        <i className="fas fa-calendar-plus"></i>
                        Đặt lịch khám
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
