'use strict';

const host = 'http://localhost:3000';
const default_limit = 10;

const ValidationAttrs = {
    en: {
        attributes: {
            lower_mmr: 'low mmr',
            upper_mmr: 'high mmr',
            average_mmr: 'average mmr',
            steam_id: 'steam ID',
        },
    },
};
VeeValidate.Validator.localize(ValidationAttrs);
Vue.use(VeeValidate);

Vue.component('multiselect', VueMultiselect.default)

var app = new Vue({
    el: '#app',
    data: function() {
        return {
            input: {
                upper_mmr: '',
                lower_mmr: '',
                region: '',
            },
            listTeamInput: {
                average_mmr: '',
                region: '',
                steam_id: '',
            },
            scrims: [],
            searching: false,
            start: 0,
            limit: default_limit,
            total: '',
            searchRegions: [],
            regions: [
                {name: 'US West', abbr: 'USW'},
                {name: 'US East', abbr: 'USE'},
                {name: 'Europe West', abbr: 'EUW'},
                {name: 'Europe East', abbr: 'EUE'},
                {name: 'Russia', abbr: 'RUS'},
                {name: 'SE Asia', abbr: 'SEA'},
                {name: 'Australia', abbr: 'AUS'},
                {name: 'South America', abbr: 'SA'},
                {name: 'Dubai', abbr: 'DUB'},
                {name: 'Chile', abbr: 'CHI'},
                {name: 'Peru', abbr: 'PER'},
                {name: 'South Africa', abbr: 'SA'},
                {name: 'India', abbr: 'IND'},
                {name: 'Japan', abbr: 'JAP'},
            ],
        };
    },
    created: function() {
        this.search();
    },
    computed: {
        lowerCount: function() {
            if (this.total == 0) {
                return 0;
            }

            return this.start + 1;
        },
        upperCount: function() {
            if (this.start + this.limit > this.total) {
                return this.total;
            }
            return this.start + this.limit;
        },
        listTeamValid: function() {
            // TODO maybe a cleaner way to do this
            if (this.fields.$listTeam) {
                let dirty = Object.keys(this.fields.$listTeam).every(key => this.fields.$listTeam[key].dirty);
                return dirty && !this.errors.any('listTeam') && this.listTeamInput.region.length > 0;
            }

            return false;
        }
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
            if (this.errors.any('search') || this.searching) {
                return;
            }

            let params = {};
            for (let k in this.input) {
                if (this.input[k] !== '') {
                    params[k] = this.input[k];
                }
            }
            params.regions = this.searchRegions.map( m => m.name).join(',');

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
        listTeam() {
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
