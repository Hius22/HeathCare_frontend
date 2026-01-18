import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { getAllSpecialty } from '../../../services/userService';
import './AllSpecialty.scss';
import HomeHeader from '../../HomePage/HomeHeader';

class AllSpecialty extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSpecialty: []
        }
    }

    async componentDidMount() {
        let res = await getAllSpecialty();
        if (res && res.errCode === 0) {
            this.setState({
                dataSpecialty: res.data || []
            })
        }
    }

    handleViewDetailSpecialty = (item) => {
        this.props.history.push(`/detail-specialty/${item.id}`);
    }

    render() {
        let { dataSpecialty } = this.state;
        return (
            <div className="all-specialty-container">
                <HomeHeader />
                <h2>Tất cả chuyên khoa</h2>

                {dataSpecialty && dataSpecialty.length > 0 &&
                    dataSpecialty.map((item, index) => (
                        <div
                            className="specialty-item"
                            key={index}
                            onClick={() => this.handleViewDetailSpecialty(item)}
                        >
                            <div
                                className="specialty-image"
                                style={{ backgroundImage: `url(${item.image})` }}
                            />
                            <div className="specialty-name">{item.name}</div>
                        </div>
                    ))
                }
            </div>
        )
    }
}

export default withRouter(AllSpecialty);
