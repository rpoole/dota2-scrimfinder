'use strict';

const host = 'http://localhost:3000';
const default_limit = 5;

const ValidationAttrs = {
    en: {
        attributes: {
            lower_mmr: 'low mmr',
            upper_mmr: 'high mmr',
        },
    },
};
VeeValidate.Validator.localize(ValidationAttrs);
Vue.use(VeeValidate);

var app = new Vue({
    el: '#app',
    data: function() {
        return {
            input: {
                upper_mmr: '',
                lower_mmr: '',
                region: '',
            },
            scrims: [],
            searching: false,
            start: 0,
            limit: default_limit,
            total: '',
        };
    },
    created: function() {
        this.search();
    },
    computed: {
        upperCount: function() {
            if (this.start + this.limit > this.total) {
                return this.total;
            }
            return this.start + this.limit;
        },
    },
    methods: {
        first() {
            this.start = 0;
            this.search();
        },
        last() {
            this.start = this.total - (this.total % this.limit);
            this.search();
        },
        next() {
            this.start += this.limit;
            this.search();
        },
        previous() {
            this.start -= this.limit;
            this.search();
        },
        search(newSearch=false) {
            if (this.errors.any() || this.searching) {
                return;
            }

            let params = {};
            for (let k in this.input) {
                if (this.input[k] !== '') {
                    params[k] = this.input[k];
                }
            }

            let searchParams = new URLSearchParams(params).toString();

            if (newSearch) {
                this.start = 0;
                this.limit = default_limit;
            }

            this.searching = true;

            axios
                .get(`${host}/active_scrims?limit=${this.limit}&start=${this.start}&${searchParams}`)
                .then (resp => {
                    this.scrims = resp.data.scrims;
                    this.total = resp.data.total;
                })
                .finally(() => {
                    this.searching = false;
                });
        },
    },
    filters: {
        date: function (value) {
            if (!value) {
                return '';
            }

            return formatDate(new Date(value));
        }
    }
});

function formatDate(date) {
    var month = date.toLocaleString("en-US", { month: 'short' })
    var hours = date.getHours();
    var ampm = 'AM';
    if (hours >= 12) {
        hours -= 12;
        ampm = 'PM';
    }

    if (hours === 0) {
        hours = 12;
    }

    return month + ' ' + date.getDate() + ' ' + date.getFullYear() + ' ' + hours + ':' + date.getMinutes() + ' ' + ampm;
}
