import React, { Component } from "react";
import { connect } from "react-redux";
import './Testimonials.scss';

class Testimonials extends Component {
    constructor(props) {
        super(props);
        this.state = {
            testimonials: [
                {
                    id: 1,
                    name: "Nguyễn Hoàng",
                    location: "Hà Nội",
                    rating: 5,
                    comment: "Dịch vụ đặt lịch rất nhanh chóng, tôi không còn phải xếp hàng chờ đợi hàng giờ tại bệnh viện nữa. Rất hài lòng!",
                    initials: "NH"
                },
                {
                    id: 2,
                    name: "Thúy Linh",
                    location: "TP. HCM",
                    rating: 5,
                    comment: "Giao diện dễ sử dụng, bác sĩ tư vấn rất nhiệt tình và chuyên nghiệp. Chắc chắn sẽ quay lại.",
                    initials: "TL"
                },
                {
                    id: 3,
                    name: "Minh Khang",
                    location: "Đà Nẵng",
                    rating: 4.5,
                    comment: "Tiết kiệm được rất nhiều thời gian cho gia đình có con nhỏ. App rất hữu ích cho các bà mẹ bỉm sữa.",
                    initials: "MK"
                }
            ]
        }
    }

    renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="star filled">★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">☆</span>);
        }

        return stars;
    }

    render() {
        let { testimonials } = this.state;

        return (
            <section className="testimonials-section section-padding">
                <div className="section-container-main">
                    <div className="section-header-center">
                        <h2 className="section-title">Khách Hàng Nói Gì</h2>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial) => (
                            <div className="testimonial-card" key={testimonial.id}>
                                <div className="rating-stars">
                                    {this.renderStars(testimonial.rating)}
                                </div>
                                <p className="testimonial-comment">"{testimonial.comment}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">
                                        {testimonial.initials}
                                    </div>
                                    <div className="author-info">
                                        <h5 className="author-name">{testimonial.name}</h5>
                                        <p className="author-location">{testimonial.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn
});

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Testimonials);
