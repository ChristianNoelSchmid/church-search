import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-church-info-form',
  templateUrl: './church-info-form.component.html',
  styleUrls: ['./church-info-form.component.css']
})
export class ChurchInfoFormComponent implements OnInit {

  public states = [
    { full: "State", abbr: "Abbr." },
    { full: "Alabama", abbr: "AL" },
    { full: "Alaska", abbr: "AK" },
    { full: "Arizona", abbr: "AZ" },
    { full: "Arkansas", abbr: "AR" },
    { full: "California", abbr: "CA" },
    { full: "Colorado", abbr: "CO" },
    { full: "Connecticut", abbr: "CT" },
    { full: "Delaware", abbr: "DE" },
    { full: "Florida", abbr: "FL" },
    { full: "Georgia", abbr: "GA" },
    { full: "Hawaii", abbr: "HI" },
    { full: "Idaho", abbr: "ID" },
    { full: "Illinois", abbr: "IL" },
    { full: "Indiana", abbr: "IN" },
    { full: "Iowa", abbr: "IA" },
    { full: "Kansas", abbr: "KS" },
    { full: "Kentucky", abbr: "KY" },
    { full: "Louisiana", abbr: "LA" },
    { full: "Maine", abbr: "ME" },
    { full: "Maryland", abbr: "MD" },
    { full: "Massachusetts", abbr: "MA" },
    { full: "Michigan", abbr: "MI" },
    { full: "Minnesota", abbr: "MN" },
    { full: "Mississippi", abbr: "MS" },
    { full: "Missouri", abbr: "MO" },
    { full: "Montana", abbr: "MT" },
    { full: "Nebraska", abbr: "NE" },
    { full: "Nevada", abbr: "NV" },
    { full: "New Hampshire", abbr: "NH" },
    { full: "New Jersey", abbr: "NJ" },
    { full: "New Mexico", abbr: "NM" },
    { full: "New York", abbr: "NY" },
    { full: "North Carolina", abbr: "NC" },
    { full: "North Dakota", abbr: "ND" },
    { full: "Ohio", abbr: "OH" },
    { full: "Oklahoma", abbr: "OK" },
    { full: "Oregon", abbr: "OR" },
    { full: "Pennsylvania", abbr: "PA" },
    { full: "Rhode Island", abbr: "RI" },
    { full: "South Carolina", abbr: "SC" },
    { full: "South Dakota", abbr: "SD" },
    { full: "Tennessee", abbr: "TN" },
    { full: "Texas", abbr: "TX" },
    { full: "Utah", abbr: "UT" },
    { full: "Vermont", abbr: "VT" },
    { full: "Virginia", abbr: "VA" },
    { full: "Washington", abbr: "WA" },
    { full: "West Virginia", abbr: "WV" },
    { full: "Wisconsin", abbr: "WI" },
    { full: "Wyoming", abbr: "WY" }
  ];

  public formGroup = new FormGroup({
    name: new FormControl(""),
    address: new FormControl(""),
    city: new FormControl(""),
    state: new FormControl(-1),
    zipCode: new FormControl(""),
  });

  constructor() { }

  ngOnInit(): void {
  }

}
