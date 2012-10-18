// This tab should list all the transactions you have done with any of your accounts

var HistoryPage = new (function () {
  var hist = {};
  
  this.onShowTab = function () {
    $('#HistoryTable').empty();
    _.each(hist, function (t, hash) {
      HistoryPage.renderTransaction(t);
    });
  };

  //<table class="dataTable" ><tr><th>#</th><th>Ledger</th><th>Source</th><th>Destination</th><th>Amount</th><th>Status</th></tr><tbody id="HistoryTable"></tbody></table>
  this.onHistoryResponse = function (res, noError) {
    res = res.result || res;
    if (noError && res) {
      _.each(
        res.transactions || [],
        function (t) {
          HistoryPage.addTransaction(t, false);
        }
      );
    }
  };
  
  this.addTransaction = function (t, adjust) {
    hist[t.hash] = t;
    HistoryPage.renderTransaction(t, adjust);
  };
  
  this.renderTransaction = function (t, adjust) {
    if (t.TransactionType == 'CreditSet') {
      var amount = ncc.displayAmount(t.LimitAmount.value);
    } else if (t.TransactionType == 'OfferCreate') {
      return;
    } else {
      var amount = ncc.displayAmount(t.Amount);
    }
    
    var oldEntry = $('#' + t.hash),
        
        toAcct = t.Destination,
        toName = blobVault.addressBook.getName(toAcct),
        
        fromAcct = t.Account,
        fromName = blobVault.addressBook.getName(fromAcct),
        
        // no button if name matches one of these
        noBut = { 'you': 1, 'undefined': 1};
        editButtons = (' <button class="edit" onclick="HistoryPage.editName(this)">edit</button>' +
                    '<button class="save" onclick="HistoryPage.saveName(this)">save</button>');
        
        console.log(fromName, toName);
        
        entry = ( '<td>' + (t.inLedger || t.ledger_current_index || t.ledger_closed_index) + '</td>' +
                  '<td>' + t.TransactionType + '</td>' +
                  '<td class="addr" data-acct='+ fromAcct + ' data-name="' + fromName + '">' +
                    '<span>' + (fromName || fromAcct) + '</span>' +
                    (fromName in noBut ? '' : editButtons) +
                  '</td>' +
                  '<td class="addr" data-acct='+ toAcct + ' data-name="' + toName + '">' +
                    '<span>' + (toName || toAcct) + '</span>' +
                    (toName in noBut ? '' : editButtons) +
                  '</td>' +
                  '<td>' + amount + '</td>' +
                  '<td>' + t.status + '</td>' );

    if (oldEntry.length) {
      oldEntry.html(entry);
    } else {
      $('#HistoryTable').prepend('<tr id="' + t.hash + '">' + entry + '</tr>');

      if (adjust) {
        if (t.TransactionType == 'CreditSet' && t.Account == ncc.accountID) {
          ncc.changeBalance('XNS', -t.Fee);
          return;
        }

        var curr = t.Amount.currency || 'XNS',
            amt = t.Amount.value || t.Amount;

        if (t.Account == ncc.accountID) {
          ncc.changeBalance(curr, -amt);
          ncc.changeBalance('XNS', -t.Fee);
        }

        if (t.Destination == ncc.accountID) {
          ncc.changeBalance(curr, amt);
        }
      }
    }
  }

  this.editName = function (cellElem) {
    var cell = $(cellElem).parent(),
        content = cell.find('span'),
        saveButton = cell.find('button.save'),
        editButton = cell.find('button.edit'),
        name = content.text(),
        input = $('<input>').val(name)
                            .keydown(function (e) { if (e.which == 13) saveButton.click(); });
    
    saveButton.show();
    editButton.hide();
    content.html(input);
    input.select();
  };
  
  this.saveName = function (cellElem) {
    var cell = $(cellElem).parent(),
        addr = cell.attr('data-acct'),
        newName = cell.find('input').val();
    
    blobVault.addressBook.setEntry(newName, addr);
    blobVault.save();
    
    HistoryPage.onShowTab();
  };

})();

