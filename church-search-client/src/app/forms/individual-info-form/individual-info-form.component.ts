import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-individual-info-form',
  templateUrl: './individual-info-form.component.html',
  styleUrls: ['./individual-info-form.component.css']
})
export class IndividualInfoFormComponent implements OnInit {

  public formGroup = new FormGroup({
    firstName: new FormControl(""),
    lastName: new FormControl("")
  });

  constructor() { }

  ngOnInit(): void {
  }

}
