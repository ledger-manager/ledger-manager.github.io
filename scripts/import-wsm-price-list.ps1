param(
  [string]$BaseUrl = 'http://192.168.0.29:30080/api',
  [string]$DbName = 'wsm_dev',
  [string]$Username = 'admin',
  [string]$Password = 'tiger123$'
)

$ErrorActionPreference = 'Stop'

function Convert-MongoNumbers($obj) {
  if ($null -eq $obj) { return $null }

  if ($obj -is [System.Management.Automation.PSCustomObject]) {
    $dict = @{}
    foreach ($prop in $obj.PSObject.Properties) {
      $dict[$prop.Name] = $prop.Value
    }
    return Convert-MongoNumbers $dict
  }

  if ($obj -is [System.Collections.IDictionary]) {
    if ($obj.Contains('$numberInt')) { return [int]$obj['$numberInt'] }
    if ($obj.Contains('$numberLong')) { return [long]$obj['$numberLong'] }
    if ($obj.Contains('$numberDouble')) { return [double]$obj['$numberDouble'] }

    $out = @{}
    foreach ($k in $obj.Keys) {
      $out[$k] = Convert-MongoNumbers $obj[$k]
    }
    return $out
  }

  if ($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])) {
    $arr = @()
    foreach ($item in $obj) {
      $arr += ,(Convert-MongoNumbers $item)
    }
    return $arr
  }

  return $obj
}

$srcPath = Join-Path $PSScriptRoot '..\data\price_list.json'
$raw = Get-Content -Raw -Path $srcPath | ConvertFrom-Json
$normalized = Convert-MongoNumbers $raw

$effDateRaw = [string]$normalized._id
$effDate = if ($effDateRaw -match '^\d{8}$') {
  "$($effDateRaw.Substring(0,4))-$($effDateRaw.Substring(4,2))-$($effDateRaw.Substring(6,2))"
} else {
  $effDateRaw
}

$products = @()
foreach ($p in $normalized.products) {
  $item = @{
    seq = [int]$p._id
    name = [string]$p.nm
    type = if ($null -ne $p.tp) { [int]$p.tp } else { $null }
    subType = if ($null -ne $p.st) { [int]$p.st } else { $null }
    group = [string]$p.gp
    cp = if ($null -ne $p.cp) { [int]$p.cp } else { $null }
  }

  if ($null -ne $p.q) { $item.q = $p.q }
  if ($null -ne $p.p) { $item.p = $p.p }
  if ($null -ne $p.n) { $item.n = $p.n }
  if ($null -ne $p.d) { $item.d = $p.d }

  $products += $item
}

$doc = @{
  _id = 'PRODUCT_PRICE_LIST'
  effDate = $effDate
  itemType = 'products'
  products = $products
  saleAmt = 0
  stockAmt = 0
}

$docUrl = "$BaseUrl/$DbName/PRODUCT_PRICE_LIST"

$pair = "${Username}:${Password}"
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $basic" }

try {
  $existing = Invoke-RestMethod -Method Get -Uri $docUrl -Headers $headers -ErrorAction Stop
  if ($null -ne $existing._rev) {
    $doc._rev = $existing._rev
  }
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) {
    throw
  }
}

$payload = $doc | ConvertTo-Json -Depth 100
$payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$result = Invoke-RestMethod -Method Put -Uri $docUrl -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $payloadBytes

Write-Host "Imported PRODUCT_PRICE_LIST with $($products.Count) products"
Write-Host "CouchDB response: ok=$($result.ok) id=$($result.id) rev=$($result.rev)"
