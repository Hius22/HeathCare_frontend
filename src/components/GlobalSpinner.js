import React from 'react';
import { connect } from 'react-redux';
import './GlobalSpinner.css';

const GlobalSpinner = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
        <div className="global-spinner-overlay" role="status" aria-label="Loading">
            <div className="global-spinner-box">
                <div className="spinner-ring">
                    <div></div><div></div><div></div><div></div>
                </div>
                <p className="spinner-text">Đang tải...</p>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isLoading: state.app.isLoading
});

export default connect(mapStateToProps)(GlobalSpinner);
