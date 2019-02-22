'use strict';

const worker = new Worker('js/worker.js');
const host = 'http://localhost:3000';
const default_limit = 10;

const ValidationAttrs = {
    en: {
        attributes: {
            lower_mmr: 'low mmr',
            upper_mmr: 'high mmr',
            average_mmr: 'average mmr',
            contact: 'steam ID',
						team_name: 'team name',
        },
    },
};
VeeValidate.Validator.localize(ValidationAttrs);
Vue.use(VeeValidate);
Vue.use(Toasted, {
	theme: 'toasted-primary',
	duration: 2000,
	position: 'top-center', 
	containerClass: 'toast-container',
	className:'toast-body',
});
Vue.component('multiselect', VueMultiselect.default)

VeeValidate.Validator.extend('steamURL', {
	getMessage: () => 'You must include a link to your steam community page. Example: https://www.steamcommunity.com/id/your_id',
	validate: value => {
        const regex = new RegExp('https://www.steamcommunity.com/id/.+');
		return regex.test(value);
	},
});

axios.interceptors.response.use(response => {
	return response;
}, error => {
	if (error.response.status >= 500) {
		app.$toasted.error('Oops, something went wrong.', {
			duration: 4000,
		})
	}
	return Promise.reject(error);
});

let app = new Vue({
    el: '#app',
    data: function() {
        return {
            input: {
                upper_mmr: '',
                lower_mmr: '',
                regions: '',
            },
            listTeamInput: {
                average_mmr: '',
                region: '',
                contact: '',
                team_name: '',
            },
            scrims: [],
            searching: false,
            start: 0,
            limit: default_limit,
            token: '',
            activeScrimId: '',
            total: '',
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
        copy(event) {
            let range = document.createRange();
            range.selectNode(event.target.parentElement.previousElementSibling);
            window.getSelection().addRange(range);
            document.execCommand("copy");
            window.getSelection().removeRange(range);
            this.$toasted.success('Copied!')
        },
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

            if (params.regions) {
                params.regions = params.regions.map( m => m.name).join(',');
            }

            if (newSearch) {
                this.start = 0;
                this.limit = default_limit;
            }

            params.start = this.start;
            params.limit = this.limit;

            let searchParams = new URLSearchParams(params).toString();

            this.searching = true;

            axios
                .get(`${host}/active_scrims?${searchParams}`)
                .then (resp => {
                    this.scrims = resp.data.scrims;
                    this.total = resp.data.total;
                })
                .finally(() => {
                    this.searching = false;
                });
        },
        listTeam() {
            if(this.errors.any('listTeam')) {
                return;
            }

            axios
                .post(`${host}/list_scrim`, this.listTeamInput)
                .then( resp => {
                    this.search(true);
                    Object.keys(this.listTeamInput).forEach( k => {
                        this.listTeamInput[k] = '';
                    });
                    this.$validator.reset();

                    this.token = resp.data.token;
                    this.activeScrimId = resp.data.scrim_id;

                    worker.postMessage({token: this.token});
                });
        },
        removeScrim() {
            if (!this.token) {
                return;
            }

            axios
                .delete(`${host}/remove_scrim/${this.token}`)
                .then( resp => {
                    this.token = '';
                    this.activeScrimId = '';
                    this.search(true);
                });
        }
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


// Setup an event listener that will handle messages received from the worker.
worker.addEventListener('message', function(e) {
  // Log the workers message.
  console.log(e.data);
}, false);
