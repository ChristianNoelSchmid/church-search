import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-individual-info-form',
  templateUrl: './individual-info-form.component.html',
  styleUrls: ['./individual-info-form.component.css']
})
export class IndividualInfoFormComponent implements OnInit {

  @Output() public valueChanges = new EventEmitter<object>();

  public formGroup = new FormGroup({
    firstName: new FormControl(""),
    lastName: new FormControl("")
  });

  constructor() { }

  ngOnInit(): void {
    this.formGroup.valueChanges.subscribe(() => 
      this.valueChanges.emit(this.formGroup.value)
    );
  }

}
